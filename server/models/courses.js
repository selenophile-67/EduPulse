export const COURSE_SELECT = `
  SELECT c.*,
    u.name AS teacher_name,
    u.avatar_color AS teacher_avatar_color,
    (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.course_id = c.id) AS rating_avg,
    (SELECT COUNT(*) FROM reviews r WHERE r.course_id = c.id) AS rating_count,
    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') AS enrolled_count,
    (SELECT COUNT(*) FROM lectures l WHERE l.course_id = c.id) AS lecture_count,
    (SELECT COALESCE(SUM(l.duration_seconds), 0) FROM lectures l WHERE l.course_id = c.id) AS total_seconds
  FROM courses c
  JOIN users u ON u.id = c.teacher_id
`;

export const SORT_OPTIONS = {
  popular: 'enrolled_count DESC, rating_avg DESC',
  newest: 'c.created_at DESC',
  rating: 'rating_avg DESC, rating_count DESC',
  'price-low': 'c.price_cents ASC',
  'price-high': 'c.price_cents DESC',
};
