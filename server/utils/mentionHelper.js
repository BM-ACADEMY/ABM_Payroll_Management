const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * Parses mentions from text and sends notifications.
 * format: @Name (inserted via autocomplete) or @Name@email (legacy/robust)
 */
const processMentions = async (text, currentUser, context, io) => {
  if (!text) return [];

  // Match formats:
  // 1. @[Name](email) - New recommended format
  // 2. @Name@email - Existing format
  // 3. @Name - Fallback format (less reliable if names repeat)
  
  const complexRegex = /@\[([^\]]+)\]\(([^)]+)\)/g; // @[Name](email)
  const legacyRegex = /@\S+@\S+@\S+\.\S+/g; // @Name@user@domain.com
  const legacyRegex2 = /@\S+@\S+\.\S+/g; // @user@domain.com
  
  let emails = new Set();
  let matches;

  // 1. New format
  while ((matches = complexRegex.exec(text)) !== null) {
    emails.add(matches[2]);
  }

  // 2. Legacy formats
  const legacyMatches = (text.match(legacyRegex) || []).concat(text.match(legacyRegex2) || []);
  legacyMatches.forEach(m => {
    const parts = m.split('@');
    if (parts.length >= 2) {
      emails.add(parts.slice(-2).join('@'));
    }
  });

  // 3. Fallback: simple @Name (if not already captured)
  const simpleRegex = /@(\w+)/g;
  let simpleNames = [];
  while ((matches = simpleRegex.exec(text)) !== null) {
    const name = matches[1];
    // Avoid re-capturing names that are already part of a complex mention
    const isPartOfComplex = Array.from(emails).some(e => e.toLowerCase().includes(name.toLowerCase()));
    if (!isPartOfComplex) {
      simpleNames.push(name);
    }
  }

  if (simpleNames.length > 0) {
    const matchedUsers = await User.find({ name: { $in: simpleNames.map(n => new RegExp(`^${n}$`, 'i')) } });
    matchedUsers.forEach(u => emails.add(u.email));
  }

  const emailList = Array.from(emails);
  if (emailList.length === 0) return [];

  const mentionedUsers = await User.find({ email: { $in: emailList } });
  const mentions = mentionedUsers
    .filter(u => u._id.toString() !== currentUser.id.toString())
    .map(u => ({ user: u._id, isRead: false }));

  // Side Effects: Send Notifications
  if (mentions.length > 0) {
    mentionedUsers.forEach(async (mUser) => {
      if (mUser._id.toString() === currentUser.id.toString()) return;

      // Socket Notification
      if (io) {
        io.emit('notification', {
          userId: mUser._id,
          type: 'MENTION',
          message: `${currentUser.name} mentioned you in ${context.title || 'a comment'}`,
          taskId: context.taskId
        });
      }

      // Email Notification
      if (mUser.email) {
        await emailService.sendMentionEmail(mUser.email, {
          commenterName: currentUser.name,
          taskTitle: context.taskTitle || context.title || 'a task',
          commentText: text,
          boardName: context.boardName || 'Project Board',
          taskId: context.taskId
        });
      }
    });
  }

  return mentions;
};

module.exports = { processMentions };
