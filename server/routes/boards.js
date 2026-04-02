const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const boardController = require('../controllers/boardController');

// Board Routes
router.post('/', auth, boardController.createBoard);
router.get('/team/:teamId', auth, boardController.getBoardsByTeam);
router.get('/', auth, boardController.getBoardsByTeam); // Note: This might need teamId in params or query
router.get('/special/:type', auth, boardController.getSpecialBoard);
router.get('/:id', auth, boardController.getBoardById);
router.patch('/:id', auth, boardController.updateBoard);
router.delete('/:id', auth, boardController.deleteBoard);
router.get('/members/search', auth, boardController.searchMembers);
router.get('/shared', auth, boardController.getSharedBoards);
router.post('/:id/members', auth, boardController.addMemberToBoard);
router.delete('/:id/members/:userId', auth, boardController.removeMemberFromBoard);

// List Routes
router.post('/lists', auth, boardController.createList);
router.patch('/lists/:id', auth, boardController.updateList);
router.delete('/lists/:id', auth, boardController.deleteList);

// Task Routes
router.post('/tasks', auth, boardController.createTask);
router.patch('/tasks/:id', auth, boardController.updateTask);
router.get('/tasks/:id', auth, boardController.getTaskDetails);
router.delete('/tasks/:id', auth, boardController.deleteTask);
router.patch('/tasks/:taskId/labels', auth, boardController.updateLabels);
router.post('/tasks/:taskId/checklists', auth, boardController.addChecklist);
router.delete('/tasks/:taskId/checklists/:checklistId', auth, boardController.deleteChecklist);
router.post('/tasks/:taskId/checklists/items', auth, boardController.addChecklistItem);
router.patch('/tasks/:taskId/checklists/update', auth, boardController.updateChecklistItem);
router.delete('/tasks/:taskId/checklists/:checklistId/items/:itemId', auth, boardController.deleteChecklistItem);

// Comment Routes
router.post('/comments', auth, boardController.addComment);
router.patch('/comments/:id', auth, boardController.updateComment);
router.delete('/comments/:id', auth, boardController.deleteComment);

module.exports = router;
