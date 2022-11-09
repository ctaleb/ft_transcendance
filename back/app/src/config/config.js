const application = {
  env: 'development',
  port: 5000,
};

const database = {
  // Fetch infos from env variables
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  name: 'transDB',
};

module.exports = {
  application,
  database,
};
