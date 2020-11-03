const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

const setReponse = (username, repos) => {
  return `<h1>${username} has ${repos} github repos</h1>`;
};

const getRepos = async (req, res) => {
  try {
    const { username } = req.params;
    console.log("FETCHING DATA", username);
    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;

    client.setex(username, 3600, repos);

    res.send(setReponse(username, repos));
  } catch (error) {
    console.log(error);
    res.status(500);
  }
};

// cache middleware
const cache = (req, res, next) => {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setReponse(username, data));
    } else {
      next();
    }
  });
};

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on PORT ${PORT}`);
});
