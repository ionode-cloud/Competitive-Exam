// Pagination helper
exports.paginate = (query, page, limit) => {
  const p = parseInt(page, 10) || 1;
  const l = parseInt(limit, 10) || 10;
  const skip = (p - 1) * l;
  return { skip, limit: l, page: p };
};

exports.paginateResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    totalPages: Math.ceil(total / (parseInt(limit, 10) || 10)),
    hasNext: parseInt(page, 10) < Math.ceil(total / (parseInt(limit, 10) || 10)),
    hasPrev: parseInt(page, 10) > 1,
  },
});
