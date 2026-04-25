const webpush = require('web-push');
const User = require('../models/User');
const Role = require('../models/Role');

// Setup webpush with VAPID keys
webpush.setVapidDetails(
  'mailto:admin@bmtechx.in',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a specific user
 * @param {string} userId - ID of the user to notify
 * @param {object} payload - Notification payload { title, body, icon, data }
 */
exports.sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
        return;
    }

    const payloadString = JSON.stringify(payload);

    const sendPromises = user.pushSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payloadString);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Subscription has expired or is no longer valid
          console.log(`Push subscription for user ${userId} expired. Removing...`);
          // Note: We'll remove it later to avoid concurrent modification issues
          return { expired: true, subscription };
        }
        console.error(`Error sending push notification to user ${userId}:`, error.message);
      }
      return { expired: false };
    });

    const results = await Promise.all(sendPromises);
    
    // Clean up expired subscriptions
    const expiredSubscriptions = results
      .filter(r => r.expired)
      .map(r => r.subscription);

    if (expiredSubscriptions.length > 0) {
        await User.findByIdAndUpdate(userId, {
            $pull: { pushSubscriptions: { endpoint: { $in: expiredSubscriptions.map(s => s.endpoint) } } }
        });
    }
  } catch (err) {
    console.error('Error in sendPushNotification:', err.message);
  }
};

/**
 * Send a push notification to all admins
 * @param {object} payload - Notification payload
 */
exports.notifyAdmins = async (payload) => {
  try {
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) return;

    const admins = await User.find({ role: adminRole._id });
    const notificationPromises = admins.map(admin => this.sendPushNotification(admin._id, payload));
    await Promise.all(notificationPromises);
  } catch (err) {
    console.error('Error notifying admins:', err.message);
  }
};
