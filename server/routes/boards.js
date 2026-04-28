const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const boardController = require('../controllers/boardController');

// Board Routes
// 1. Specific Resource-Specific Routes
router.get('/shared', auth, boardController.getSharedBoards);
router.get('/members/search', auth, boardController.searchMembers);
router.get('/special/:type', auth, boardController.getSpecialBoard);
router.get('/team/:teamId/destinations', auth, boardController.getBoardDestinations);
router.get('/team/:teamId', auth, boardController.getBoardsByTeam);
router.patch('/reorder', auth, boardController.reorderBoards);
router.get('/', auth, boardController.getBoardsByTeam);

// 2. Generic Parameter-based Board Routes (MUST BE LAST)
router.get('/:id', auth, boardController.getBoardById);
router.patch('/:id', auth, boardController.updateBoard);
router.delete('/:id', auth, boardController.deleteBoard);
router.post('/:id/members', auth, boardController.addMemberToBoard);
router.delete('/:id/members/:userId', auth, boardController.removeMemberFromBoard);
router.post('/', auth, boardController.createBoard);

// List Routes
router.post('/lists', auth, boardController.createList);
router.patch('/lists/:id', auth, boardController.updateList);
router.delete('/lists/:id', auth, boardController.deleteList);

// Task Routes
router.post('/tasks', auth, boardController.createTask);
router.patch('/tasks/:id', auth, boardController.updateTask);
router.get('/tasks/:id', auth, boardController.getTaskDetails);
router.patch('/tasks/:taskId/mark-mentions-read', auth, boardController.markMentionsAsRead);
router.patch('/tasks/reorder', auth, boardController.reorderTasks);
router.delete('/tasks/:id', auth, boardController.deleteTask);
router.patch('/tasks/:taskId/labels', auth, boardController.updateLabels);
router.post('/tasks/:taskId/checklists', auth, boardController.addChecklist);
router.delete('/tasks/:taskId/checklists/:checklistId', auth, boardController.deleteChecklist);
router.patch('/tasks/:taskId/checklists/:checklistId/rename', auth, boardController.renameChecklist);
router.post('/tasks/:taskId/checklists/items', auth, boardController.addChecklistItem);
router.patch('/tasks/:taskId/checklists/update', auth, boardController.updateChecklistItem);
router.delete('/tasks/:taskId/checklists/:checklistId/items/:itemId', auth, boardController.deleteChecklistItem);

// Comment Routes
router.post('/comments', auth, boardController.addComment);
router.patch('/comments/:id', auth, boardController.updateComment);
router.delete('/comments/:id', auth, boardController.deleteComment);

module.exports = router;
