const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const CardHistory = require('../models/CardHistory');
const User = require('../models/User');

// --- Board Operations ---

exports.createBoard = async (req, res) => {
  const { title, description, teamId } = req.body;
  try {
    const board = new Board({
      title,
      description,
      team: teamId,
      admins: [req.user.id],
      members: [req.user.id]
    });
    await board.save();
    res.json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getBoardsByTeam = async (req, res) => {
  try {
    const boards = await Board.find({ team: req.params.teamId }).populate('team', 'name');
    res.json(boards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('team', 'name')
      .populate('members', 'name email employeeId')
      .populate('admins', 'name email');
    
    if (!board) return res.status(404).json({ msg: 'Board not found' });

    // Ensure only members or admins can view
    const isMember = board.members.some(m => m._id.toString() === req.user.id);
    const isAdmin = req.user.role?.name === 'admin';
    if (!isMember && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to view this board' });
    }

    const lists = await List.find({ board: req.params.id }).sort('position');
    const tasks = await Task.find({ board: req.params.id })
      .populate('assignees', 'name email')
      .sort('position')
      .lean();

    // Get all comments for these tasks to count mentions and total comments
    const taskIds = tasks.map(t => t._id);
    const comments = await Comment.find({ task: { $in: taskIds } });
    const user = await User.findById(req.user.id);

    const tasksWithCounts = tasks.map(task => {
      const taskComments = comments.filter(c => c.task.toString() === task._id.toString());
      
      // Count unread mentions for the current user
      const mentionCount = taskComments.filter(c => 
        c.mentions?.some(m => m.user.toString() === req.user.id && !m.isRead)
      ).length;

      return {
        ...task,
        commentCount: taskComments.length,
        mentionCount
      };
    });

    res.json({ board, lists, tasks: tasksWithCounts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (req.io) {
      req.io.to(req.params.id).emit('board_updated', { type: 'BOARD_UPDATED', boardId: req.params.id });
    }

    res.json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- List Operations ---

exports.createList = async (req, res) => {
  const { title, boardId, position } = req.body;
  try {
    const list = new List({
      title,
      board: boardId,
      position
    });
    await list.save();

    if (req.io) {
      req.io.to(boardId).emit('board_updated', { type: 'LIST_CREATED', boardId });
    }

    res.json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateList = async (req, res) => {
  try {
    const list = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (req.io) {
      req.io.to(list.board.toString()).emit('board_updated', { type: 'LIST_UPDATED', boardId: list.board });
    }

    res.json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ msg: 'List not found' });
    
    const boardId = list.board.toString();
    await List.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ list: req.params.id });

    if (req.io) {
      req.io.to(boardId).emit('board_updated', { type: 'LIST_DELETED', boardId });
    }

    res.json({ msg: 'List deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- Task Operations ---

exports.createTask = async (req, res) => {
  const { title, description, listId, boardId, position, parentTaskId } = req.body;
  try {
    const task = new Task({
      title,
      description,
      list: listId,
      board: boardId,
      position,
      parentTask: parentTaskId || null
    });
    await task.save();

    // Log History
    const history = new CardHistory({
      task: task._id,
      user: req.user.id,
      action: 'CREATED',
      details: `Created task "${title}"`
    });
    await history.save();

    if (req.io) {
      req.io.to(boardId).emit('board_updated', { type: 'TASK_CREATED', boardId });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateTask = async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ msg: 'Task not found' });

    const task = await Task.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
    
    // Log History for major changes
    let actions = [];
    let details = "";
    if (req.body.list && req.body.list !== (oldTask.list._id || oldTask.list).toString()) {
       const newList = await List.findById(req.body.list);
       actions.push('MOVED');
       details = `moved this card to ${newList?.title}`;
    }
    if (req.body.isCompleted !== undefined && req.body.isCompleted !== oldTask.isCompleted) {
       actions.push(req.body.isCompleted ? 'COMPLETED' : 'REOPENED');
       details = req.body.isCompleted ? 'completed this card' : 'reopened this card';
    }
    if (req.body.deadline && req.body.deadline !== oldTask.deadline?.toISOString()) {
       actions.push('UPDATED');
       details = `changed the due date of this card to ${new Date(req.body.deadline).toLocaleString()}`;
    }
    if (req.body.description && req.body.description !== oldTask.description) {
       actions.push('UPDATED');
       details = 'updated the description of this card';
    }
    
    if (actions.length > 0) {
      const history = new CardHistory({
        task: task._id,
        user: req.user.id,
        action: actions[0],
        details: details || `Updated task properties`
      });
      await history.save();
    }

    // Mention Notifications for Description
    if (req.body.description) {
      const mentions = req.body.description.match(/@\S+@\S+\.\S+/g); // Match @name@email.com
      if (mentions && req.io) {
        const emails = mentions.map(m => m.split('@').pop());
        const mentionedUsers = await User.find({ email: { $in: emails } });
        
        mentionedUsers.forEach(mUser => {
          if (mUser._id.toString() !== req.user.id) {
            req.io.emit('notification', {
              userId: mUser._id,
              type: 'MENTION',
              message: `${req.user.name} mentioned you in ${task.title}`,
              taskId: task._id
            });
          }
        });
      }
    }

    if (req.io) {
      req.io.to(task.board.toString()).emit('board_updated', { type: 'TASK_UPDATED', boardId: task.board, taskId: task._id });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getTaskDetails = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email')
      .populate('checklists.items.assignedTo', 'name email')
      .populate('parentTask', 'title');
    
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    const comments = await Comment.find({ task: req.params.id }).populate('user', 'name').sort('-createdAt');
    const history = await CardHistory.find({ task: req.params.id }).populate('user', 'name').sort('-createdAt');
    const subTasks = await Task.find({ parentTask: req.params.id }).populate('assignees', 'name email');

    // Mark mentions for the current user as read in this task
    await Comment.updateMany(
      { task: req.params.id, "mentions.user": req.user.id },
      { $set: { "mentions.$.isRead": true } }
    );

    // Count mentions for the current user in task comments and description (unread only)
    const mentionCount = comments.filter(c => 
      c.mentions.some(m => m.user.toString() === req.user.id && !m.isRead)
    ).length;

    res.json({ 
      task: { ...task.toObject(), mentionCount }, 
      comments, 
      history, 
      subTasks 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    const boardId = task.board.toString();
    await Task.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ parentTask: req.params.id });

    if (req.io) {
      req.io.to(boardId).emit('board_updated', { type: 'TASK_DELETED', boardId });
    }

    res.json({ msg: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- Comment Operations ---

exports.addComment = async (req, res) => {
  const { text, taskId } = req.body;
  try {
    const comment = new Comment({
      task: taskId,
      user: req.user.id,
      text
    });

    // Populate mentions
    const mentionsMatches = text.match(/@\S+@\S+\.\S+/g);
    if (mentionsMatches) {
      const emails = mentionsMatches.map(m => m.split('@').pop());
      const mentionedUsers = await User.find({ email: { $in: emails } });
      comment.mentions = mentionedUsers
        .filter(mUser => mUser._id.toString() !== req.user.id)
        .map(mUser => ({ user: mUser._id, isRead: false }));
    }

    await comment.save();
    
    // Also add to history
    const history = new CardHistory({
      task: taskId,
      user: req.user.id,
      action: 'COMMENTED',
      details: `Added a comment: "${text.substring(0, 20)}..."`
    });
    await history.save();

    // Tag Notifications
    if (comment.mentions.length > 0 && req.io) {
      comment.mentions.forEach(mention => {
        req.io.emit('notification', {
          userId: mention.user,
          type: 'MENTION',
          message: `${req.user.name} mentioned you in a comment`,
          taskId: taskId
        });
      });
    }

    const task = await Task.findById(taskId);
    if (req.io && task) {
      req.io.to(task.board.toString()).emit('board_updated', { type: 'COMMENT_ADDED', boardId: task.board, taskId });
    }

    res.json(comment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateComment = async (req, res) => {
  const { text } = req.body;
  try {
    let comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    // Recalculate mentions for updated comment
    const mentionsMatches = text.match(/@\S+@\S+\.\S+/g);
    let mentions = [];
    if (mentionsMatches) {
      const emails = mentionsMatches.map(m => m.split('@').pop());
      const mentionedUsers = await User.find({ email: { $in: emails } });
      mentions = mentionedUsers
        .filter(mUser => mUser._id.toString() !== req.user.id)
        .map(mUser => ({ user: mUser._id, isRead: false }));
    }

    comment = await Comment.findByIdAndUpdate(req.params.id, { text, mentions, updatedAt: Date.now() }, { new: true });
    
    // Tag Notifications for updated comment
    if (comment.mentions.length > 0 && req.io) {
      comment.mentions.forEach(mention => {
        req.io.emit('notification', {
          userId: mention.user,
          type: 'MENTION',
          message: `${req.user.name} updated a mention in a comment`,
          taskId: comment.task
        });
      });
    }

    const task = await Task.findById(comment.task);
    if (req.io && task) {
       req.io.to(task.board.toString()).emit('board_updated', { type: 'COMMENT_UPDATED', boardId: task.board, taskId: comment.task });
    }
    res.json(comment);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    const task = await Task.findById(comment.task);
    await Comment.findByIdAndDelete(req.params.id);
    
    if (req.io && task) {
       req.io.to(task.board.toString()).emit('board_updated', { type: 'COMMENT_DELETED', boardId: task.board, taskId: task._id });
    }
    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// --- Checklist & Label Operations ---

exports.addChecklist = async (req, res) => {
  const { name } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $push: { checklists: { name, items: [] } } },
      { new: true }
    );
    
    if (req.io) {
      req.io.to(task.board.toString()).emit('board_updated', { type: 'CHECKLIST_ADDED', boardId: task.board, taskId: req.params.taskId });
    }

    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.addChecklistItem = async (req, res) => {
  const { text, checklistId, assignedTo, dueDate } = req.body;
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, "checklists._id": checklistId },
      { $push: { "checklists.$.items": { text, assignedTo, dueDate } } },
      { new: true }
    );

    if (req.io) {
      req.io.to(task.board.toString()).emit('board_updated', { type: 'CHECKLIST_ITEM_ADDED', boardId: task.board, taskId: req.params.taskId });
    }

    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.updateChecklistItem = async (req, res) => {
  const { checklistId, itemId, isCompleted, text, assignedTo, dueDate } = req.body;
  try {
    const updateObj = {};
    if (isCompleted !== undefined) updateObj["checklists.$.items.$[elem].isCompleted"] = isCompleted;
    if (text !== undefined) updateObj["checklists.$.items.$[elem].text"] = text;
    if (assignedTo !== undefined) updateObj["checklists.$.items.$[elem].assignedTo"] = assignedTo;
    if (dueDate !== undefined) updateObj["checklists.$.items.$[elem].dueDate"] = dueDate;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, "checklists._id": checklistId },
      { $set: updateObj },
      { 
        arrayFilters: [{ "elem._id": itemId }],
        new: true 
      }
    );

    if (req.io) {
      req.io.to(task.board.toString()).emit('board_updated', { type: 'CHECKLIST_ITEM_UPDATED', boardId: task.board, taskId: req.params.taskId });
    }

    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteChecklistItem = async (req, res) => {
  const { taskId, checklistId, itemId } = req.params;
  try {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, "checklists._id": checklistId },
      { $pull: { "checklists.$.items": { _id: itemId } } },
      { new: true }
    );

    if (req.io) {
      req.io.to(task.board.toString()).emit('board_updated', { type: 'CHECKLIST_ITEM_DELETED', boardId: task.board, taskId });
    }

    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.updateLabels = async (req, res) => {
  const { labels } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(req.params.taskId, { labels }, { new: true });
    
    if (req.io) {
      req.io.to(task.board.toString()).emit('board_updated', { type: 'LABELS_UPDATED', boardId: task.board, taskId: req.params.taskId });
    }

    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteChecklist = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $pull: { checklists: { _id: req.params.checklistId } } },
      { new: true }
    );

    if (req.io) {
      req.io.to(task.board.toString()).emit('board_updated', { type: 'CHECKLIST_DELETED', boardId: task.board, taskId: req.params.taskId });
    }

    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// --- Member Operations ---

exports.addMemberToBoard = async (req, res) => {
  const { userId } = req.body;
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, { $addToSet: { members: userId } }, { new: true }).populate('members', 'name email');
    
    if (req.io) {
      req.io.to(req.params.id).emit('board_updated', { type: 'MEMBER_ADDED', boardId: req.params.id, userId });
    }

    res.json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
