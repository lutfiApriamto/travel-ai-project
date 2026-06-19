import app           from '../src/app.js';
import startExpireJob from '../src/jobs/expireProducts.job.js';

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[DEV] Server berjalan di http://localhost:${PORT}`);
    startExpireJob();
  });
}

export default app;
