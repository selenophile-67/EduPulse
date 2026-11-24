import { Router } from 'express';
import { authenticate, requireRole, requireApprovedTeacher } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import {
  overview, listCourses, createCourse, updateCourse, courseManageDetail, createSubject, deleteSubject,
  createChapter, deleteChapter, createLecture, updateLecture, deleteLecture, uploadVideo, uploadPdf,
  listTests, createTest, testManageDetail, updateTest, addQuestions, deleteQuestion,
  listMaterials, createMaterial, deleteMaterial, listStudents, studentDetail,
  courseSchema, courseUpdateSchema, lectureSchema, lectureUpdateSchema, testSchema, testUpdateSchema,
  questionBatchSchema, materialSchema,
} from '../controllers/teacher.controller.js';
import { teacherLiveClasses } from '../controllers/liveClasses.controller.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, requireRole('teacher'));

router.get('/overview', overview);
router.use(requireApprovedTeacher);

router.get('/courses', listCourses);
router.post('/courses', validate({ body: courseSchema }), createCourse);
router.get('/courses/:id', courseManageDetail);
router.patch('/courses/:id', validate({ body: courseUpdateSchema }), updateCourse);
router.post('/courses/:id/subjects', validate({ body: z.object({ name: z.string().trim().min(2).max(80) }) }), createSubject);
router.delete('/subjects/:id', deleteSubject);
router.post('/subjects/:id/chapters', validate({ body: z.object({ name: z.string().trim().min(2).max(120) }) }), createChapter);
router.delete('/chapters/:id', deleteChapter);

router.post('/lectures', validate({ body: lectureSchema }), createLecture);
router.patch('/lectures/:id', validate({ body: lectureUpdateSchema }), updateLecture);
router.delete('/lectures/:id', deleteLecture);

router.post('/uploads/video', upload.single('video'), uploadVideo);
router.post('/uploads/pdf', upload.single('pdf'), uploadPdf);

router.get('/tests', listTests);
router.post('/tests', validate({ body: testSchema }), createTest);
router.get('/tests/:id', testManageDetail);
router.patch('/tests/:id', validate({ body: testUpdateSchema }), updateTest);
router.post('/tests/:id/questions', validate({ body: questionBatchSchema }), addQuestions);
router.delete('/questions/:id', deleteQuestion);

router.get('/materials', listMaterials);
router.post('/materials', validate({ body: materialSchema }), createMaterial);
router.delete('/materials/:id', deleteMaterial);

router.get('/students', listStudents);
router.get('/students/:id', studentDetail);
router.get('/live-classes', teacherLiveClasses);

export default router;
