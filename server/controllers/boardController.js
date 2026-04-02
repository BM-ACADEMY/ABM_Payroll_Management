const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const CardHistory = require('../models/CardHistory');
const User = require('../models/User');
const Team = require('../models/Team');
const mongoose = require('mongoose');

// --- Board Operations ---

exports.getSpecialBoard = async (req, res) => {
  const { type } = req.params; // 'daily' or 'weekly'
  try {
    const user = await User.findById(req.user.id).populate('role', 'name');
    const isAdmin = user.role?.name === 'admin';
    let teamId = req.query.teamId;
    
    // If no teamId provided, use user's assigned team or fallback
    if (!teamId) {
      if (!user.teams || user.teams.length === 0) {
        if (isAdmin) {
          const defaultTeam = await Team.findOne();
          if (!defaultTeam) {
              return res.status(400).json({ msg: 'No teams created yet' });
          }
          teamId = defaultTeam._id;
        } else {
          return res.status(400).json({ msg: 'User is not assigned to any team' });
        }
      } else {
        teamId = user.teams[0]; // Use first team
      }
    }
    
    let board = await Board.findOne({ team: teamId, type });
    
    if (!board) {
      // Auto-create
      board = new Board({
        title: type === 'daily' ? 'Daily Board' : 'Weekly Board',
        description: type === 'daily' ? 'Daily tasks and progress' : 'Weekly focus and goals',
        team: teamId,
        type,
        admins: [req.user.id],
        members: [req.user.id]
      });
      await board.save();
      
      // Auto-create lists for Daily Board
      if (type === 'daily') {
        const defaultLists = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        for (let i = 0; i < defaultLists.length; i++) {
          const list = new List({
            title: defaultLists[i],
            board: board._id,
            position: i
          });
          await list.save();
        }
      } else if (type === 'weekly') {
        const defaultLists = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        for (let i = 0; i < defaultLists.length; i++) {
          const list = new List({
            title: defaultLists[i],
            board: board._id,
            position: i
          });
          await list.save();
        }
      }
    }
    
    // Ensure board is fully populated for the frontend
    const populatedBoard = await Board.findById(board._id)
      .populate('team', 'name')
      .populate('members', 'name email employeeId')
      .populate('admins', 'name email');

    // Fetch lists and tasks for the board
    const lists = await List.find({ board: board._id }).sort('position');
    const tasks = await Task.find({ board: board._id })
      .populate('assignees', 'name email')
      .sort('position')
      .lean();

    // Get all comments for these tasks
    const taskIds = tasks.map(t => t._id);
    const comments = await Comment.find({ task: { $in: taskIds } });

    const tasksWithCounts = tasks.map(task => {
      const taskComments = comments.filter(c => c.task.toString() === task._id.toString());
      const mentionCount = taskComments.filter(c => 
        c.mentions?.some(m => m.user.toString() === req.user.id && !m.isRead)
      ).length;

      return {
        ...task,
        commentCount: taskComments.length,
        mentionCount
      };
    });

    res.json({ board: populatedBoard, lists, tasks: tasksWithCounts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createBoard = async (req, res) => {
  const { title, description, teamId } = req.body;
  try {
    const isAdmin = req.user.role?.name === 'admin' || req.user.role === 'admin' || 
                    req.user.role?.name === 'subadmin' || req.user.role === 'subadmin';
    const user = await User.findById(req.user.id);
    
    let targetTeamId = teamId;
    if (!isAdmin) {
      if (!user.teams || user.teams.length === 0) {
        return res.status(400).json({ msg: 'You must be assigned to a team to create a board' });
      }
      targetTeamId = user.teams[0]; // Use employee's primary team
    }

    if (!targetTeamId) {
      return res.status(400).json({ msg: 'Team selection is required' });
    }

    // Auto-populate members: All users currently assigned to this team
    const teamMembers = await User.find({ teams: targetTeamId }).select('_id');
    const memberIds = teamMembers.map(m => m._id);
    
    // Ensure the creator is also an admin of the board
    const board = new Board({
      title,
      description,
      team: targetTeamId,
      admins: [req.user.id],
      members: Array.from(new Set([...memberIds, req.user.id])) // Unique IDs including creator
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
    const isAdmin = req.user.role === 'admin' || req.user.role?.name === 'admin' || 
                    req.user.role === 'subadmin' || req.user.role?.name === 'subadmin';
    
    let query = { team: req.params.teamId };
    
    // If not admin/subadmin, only show boards where user is a member or board admin
    if (!isAdmin) {
      query.$or = [
        { members: req.user.id },
        { admins: req.user.id }
      ];
    }

    // Filter out special tactical boards from the general project list
    query.type = { $nin: ['daily', 'weekly'] };
    
    const boards = await Board.find(query).populate('team', 'name');
    
    // Auto-create "Upcoming Projects" if no regular boards exist
    if (boards.length === 0) {
      const teamId = req.params.teamId;
      const team = await Team.findById(teamId);
      if (team) {
        const defaultBoard = new Board({
          title: 'Upcoming Projects',
          description: 'A place to list all upcoming team projects and tasks',
          team: teamId,
          type: 'regular',
          admins: [req.user.id],
          members: [req.user.id]
        });
        await defaultBoard.save();
        
        // Add default lists
        const defaultLists = ['To Do', 'In Process', 'Done'];
        for (let i = 0; i < defaultLists.length; i++) {
          const list = new List({
            title: defaultLists[i],
            board: defaultBoard._id,
            position: i
          });
          await list.save();
        }
        
        const populatedBoard = await Board.findById(defaultBoard._id).populate('team', 'name');
        return res.json([populatedBoard]);
      }
    }
    
    res.json(boards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getBoardById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid board ID format' });
    }
    
    const board = await Board.findById(req.params.id)
      .populate('team', 'name')
      .populate('members', 'name email employeeId')
      .populate('admins', 'name email');
    
    if (!board) return res.status(404).json({ msg: 'Board not found' });

    // Ensure only members or admins can view
    const isMember = board.members.some(m => (m._id || m).toString() === req.user.id);
    const isBoardAdmin = board.admins?.some(a => (a._id || a).toString() === req.user.id);
    const isAdmin = req.user.role === 'admin' || req.user.role?.name === 'admin' || 
                    req.user.role === 'subadmin' || req.user.role?.name === 'subadmin';
    
    if (!isMember && !isBoardAdmin && !isAdmin) {
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

exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ msg: 'Board not found' });

    // Access control: Only global admins/subadmins or board-level admins can delete boards
    const isAdmin = req.user.role === 'admin' || req.user.role?.name === 'admin' || 
                    req.user.role === 'subadmin' || req.user.role?.name === 'subadmin';
    const isBoardAdmin = board.admins.some(a => a.toString() === req.user.id);

    if (!isAdmin && !isBoardAdmin) {
      return res.status(403).json({ msg: 'Not authorized to delete this board' });
    }

    const tasks = await Task.find({ board: req.params.id });
    const taskIds = tasks.map(t => t._id);

    // Recursive cleanup
    await Comment.deleteMany({ task: { $in: taskIds } });
    await CardHistory.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ board: req.params.id });
    await List.deleteMany({ board: req.params.id });
    await Board.findByIdAndDelete(req.params.id);

    if (req.io) {
      req.io.emit('board_deleted', { boardId: req.params.id });
    }

    res.json({ msg: 'Board deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- List Operations ---

exports.createList = async (req, res) => {
  const { title, boardId, position } = req.body;
  
  if (!boardId) {
    return res.status(400).json({ msg: 'Board ID is required' });
  }

  try {
    const list = new List({
      title,
      board: boardId,
      position: position || 0
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
    const { title, description, listId, boardId, position, parentTaskId, originTaskId, originChecklistItemId, assignees, deadline } = req.body;
    try {
      const task = new Task({
        title,
        description,
        list: listId,
        board: boardId,
        position: position || 0,
        parentTask: parentTaskId || null,
        originTaskId: originTaskId || null,
        originChecklistItemId: originChecklistItemId || null,
        assignees: assignees || [],
        deadline: deadline || null
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

    // --- Status Synchronization ---
    if (req.body.isCompleted !== undefined) {
      const isCompleted = req.body.isCompleted;

      // 1. Sync with Origin Task (if current task is the converted card)
      if (task.originTaskId) {
        await Task.findByIdAndUpdate(task.originTaskId, { isCompleted, updatedAt: Date.now() });
        // Emit update for the origin board
        const originTask = await Task.findById(task.originTaskId);
        if (req.io && originTask) {
          req.io.to(originTask.board.toString()).emit('board_updated', { type: 'TASK_UPDATED', boardId: originTask.board, taskId: originTask._id });
        }
      }

      // 2. Sync with Origin Checklist Item
      if (task.originChecklistItemId) {
        const parentTask = await Task.findOne({ "checklists.items._id": task.originChecklistItemId });
        if (parentTask) {
          await Task.findOneAndUpdate(
            { _id: parentTask._id, "checklists.items._id": task.originChecklistItemId },
            { $set: { "checklists.$[].items.$[elem].isCompleted": isCompleted } },
            { arrayFilters: [{ "elem._id": task.originChecklistItemId }] }
          );
          if (req.io) {
            req.io.to(parentTask.board.toString()).emit('board_updated', { type: 'CHECKLIST_ITEM_UPDATED', boardId: parentTask.board, taskId: parentTask._id });
          }
        }
      }

      // 3. Sync with all "children" cards (if current task is the source)
      const linkedCards = await Task.find({ originTaskId: task._id });
      for (const card of linkedCards) {
        await Task.findByIdAndUpdate(card._id, { isCompleted, updatedAt: Date.now() });
        if (req.io) {
          req.io.to(card.board.toString()).emit('board_updated', { type: 'TASK_UPDATED', boardId: card.board, taskId: card._id });
        }
      }
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
    const updateFields = {};
    if (isCompleted !== undefined) updateFields["checklists.$[].items.$[elem].isCompleted"] = isCompleted;
    if (text !== undefined) updateFields["checklists.$[].items.$[elem].text"] = text;
    if (assignedTo !== undefined) updateFields["checklists.$[].items.$[elem].assignedTo"] = assignedTo;
    if (dueDate !== undefined) updateFields["checklists.$[].items.$[elem].dueDate"] = dueDate;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, "checklists.items._id": itemId },
      { $set: updateFields },
      { arrayFilters: [{ "elem._id": itemId }], new: true }
    );

    // --- Status Synchronization ---
    if (isCompleted !== undefined) {
      // Find cards converted from this checklist item and update them
      const convertedCards = await Task.find({ originChecklistItemId: itemId });
      for (const card of convertedCards) {
        await Task.findByIdAndUpdate(card._id, { isCompleted, updatedAt: Date.now() });
        if (req.io) {
          req.io.to(card.board.toString()).emit('board_updated', { type: 'TASK_UPDATED', boardId: card.board, taskId: card._id });
        }
      }
    }

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
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ msg: 'Board not found' });

    const isAdmin = req.user.role?.name === 'admin' || req.user.role === 'admin' || 
                    req.user.role?.name === 'subadmin' || req.user.role === 'subadmin';

    // If not admin, verify the target user belongs to the same team as the board
    if (!isAdmin) {
      const targetUser = await User.findById(userId);
      const isSameTeam = targetUser?.teams?.some(t => t.toString() === board.team.toString());
      if (!targetUser || !isSameTeam) {
        return res.status(403).json({ msg: 'You can only add members from your own team' });
      }
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      req.params.id, 
      { $addToSet: { members: userId } }, 
      { new: true }
    ).populate('members', 'name email');
    
    if (req.io) {
      req.io.to(req.params.id).emit('board_updated', { type: 'MEMBER_ADDED', boardId: req.params.id, userId });
    }

    res.json(updatedBoard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.removeMemberFromBoard = async (req, res) => {
  try {
    const { userId } = req.params;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ msg: 'Board not found' });

    // Access control: ONLY system global admins/subadmins can "restrict" (remove) members
    const isAdmin = req.user.role === 'admin' || req.user.role?.name === 'admin' || 
                    req.user.role === 'subadmin' || req.user.role?.name === 'subadmin';

    if (!isAdmin) {
      return res.status(403).json({ msg: 'Only system administrators can remove members from a board' });
    }

    // Pull from both members and admins
    board.members.pull(userId);
    board.admins.pull(userId);
    await board.save();

    if (req.io) {
      req.io.to(req.params.id).emit('board_updated', { type: 'MEMBER_REMOVED', boardId: req.params.id, userId });
    }

    const updatedBoard = await Board.findById(req.params.id).populate('members', 'name email').populate('admins', 'name email');
    res.json(updatedBoard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.searchMembers = async (req, res) => {
  try {
    const users = await User.find({}).select('name email teams').populate('teams', 'name');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSharedBoards = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Unauthorized: No user ID in token' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found in database' });
    }

    const userTeamIds = user.teams ? user.teams.map(t => t.toString()) : [];
    
    // Find boards where:
    // 1. User is an explicit member
    // 2. Board's team is NOT in the user's primary teams
    // 3. Board is not a tactical board (daily/weekly)
    const query = {
      members: req.user.id,
      team: { $nin: userTeamIds },
      type: { $nin: ['daily', 'weekly'] }
    };

    const boards = await Board.find(query).populate('team', 'name');
    res.json(boards);
  } catch (err) {
    console.error('getSharedBoards Error:', err.message);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
};

/**
 * Optimized endpoint to fetch all possible board/list destinations for a team.
 */
exports.getBoardDestinations = async (req, res) => {
  const { teamId } = req.params;
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role?.name === 'admin' || 
                    req.user.role === 'subadmin' || req.user.role?.name === 'subadmin';
    
    // Find all boards for the team (including tactical ones)
    const query = { team: teamId };
    
    if (!isAdmin) {
      query.$or = [{ members: req.user.id }, { admins: req.user.id }];
    }

    const boards = await Board.find(query).select('title _id type').lean();
    const boardIds = boards.map(b => b._id);
    const lists = await List.find({ board: { $in: boardIds } }).sort('position').lean();

    const destinations = lists.map(list => {
      const parentBoard = boards.find(b => b._id.toString() === list.board.toString());
      return {
        id: `${list.board}|${list._id}`,
        boardId: list.board,
        boardTitle: parentBoard ? parentBoard.title : 'Unknown Board',
        boardType: parentBoard ? parentBoard.type : 'regular',
        listId: list._id,
        listTitle: list.title
      };
    });

    res.json(destinations);
  } catch (err) {
    console.error('getBoardDestinations Error:', err.message);
    res.status(500).send('Server Error');
  }
};
