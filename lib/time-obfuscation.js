module.exports = async success => {
  const sleep = Math.floor(Math.random() * (success ? 1500 : 4000));
  await new Promise(r => setTimeout(r, sleep));
};
