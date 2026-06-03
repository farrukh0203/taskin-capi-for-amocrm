// Deployment va environment variables tekshirish uchun
// https://YOUR-APP.vercel.app/api/test
module.exports = async function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      META_ACCESS_TOKEN: !!process.env.META_ACCESS_TOKEN,
      AMOCRM_TOKEN: !!process.env.AMOCRM_TOKEN,
    },
  });
};
