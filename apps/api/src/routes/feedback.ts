import { Router } from 'express';
import { feedbackInputSchema, type Feedback as FeedbackDto } from '@spendly/shared';
import { Feedback } from '../models/misc';

export const feedbackRouter = Router();

const toDto = (item: InstanceType<typeof Feedback>): FeedbackDto => ({
  id: item.id,
  rating: item.rating,
  message: item.message,
  createdAt: item.createdAt.toISOString(),
});

feedbackRouter.get('/', async (req, res) => {
  const items = await Feedback.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
  res.json(items.map(toDto));
});

feedbackRouter.post('/', async (req, res) => {
  const input = feedbackInputSchema.parse(req.body);
  const item = await Feedback.create({ ...input, userId: req.userId });
  res.status(201).json(toDto(item));
});
