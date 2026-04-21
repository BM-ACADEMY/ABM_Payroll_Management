const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deadline: { type: Date },
  startTime: { type: Date },
  endTime: { type: Date },
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // For sub-tasks, sub-sub-tasks
  position: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  originTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  originChecklistItemId: { type: mongoose.Schema.Types.ObjectId },
  labels: [{
    text: String,
    color: String
  }],
  checklists: [{
    name: { type: String, default: 'Checklist' },
    items: [{
      text: String,
      isCompleted: { type: Boolean, default: false },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      dueDate: { type: Date }
    }]
  }],
  attachments: [{
    name: String,
    url: String,
    fileType: String,
    createdAt: { type: Date, default: Date.now }
  }],
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  estimatedTime: { type: Number, default: 0 }, // In hours
  actualTime: { type: Number, default: 0 },    // In hours
  progress: { type: Number, default: 0, min: 0, max: 100 },
  blocker: { type: String },
  isInSprint: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
