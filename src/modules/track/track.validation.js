const { z } = require('zod');

const createTrack = {
  body: z.object({
    categoryId: z.string().uuid(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().nullable(),
    tagline: z.string().optional().nullable(),
    durationSeconds: z.preprocess((val) => val ? parseInt(val, 10) : null, z.number().int().optional().nullable()),
    isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
    isSleepTonight: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  }),
};

const getTracks = {
  query: z.object({
    categoryId: z.string().uuid().optional(),
    title: z.string().optional(),
    isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
    isSleepTonight: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
    sortBy: z.string().optional(),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().default(10)),
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().default(1)),
  }),
};

const getTrack = {
  params: z.object({
    trackId: z.string().uuid(),
  }),
};

const updateTrack = {
  params: z.object({
    trackId: z.string().uuid(),
  }),
  body: z.object({
    categoryId: z.string().uuid().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    tagline: z.string().optional().nullable(),
    durationSeconds: z.preprocess((val) => val ? parseInt(val, 10) : null, z.number().int().optional().nullable()),
    isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
    isSleepTonight: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  }).partial(),
};

const deleteTrack = {
  params: z.object({
    trackId: z.string().uuid(),
  }),
};

module.exports = {
  createTrack,
  getTracks,
  getTrack,
  updateTrack,
  deleteTrack,
};
