import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "pimpin",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query(`SELECT country_code FROM visited_countries WHERE user_id = ${currentUserId}`);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function addNewUserToObj() {


}


app.get("/", async (req, res) => {
  
  const countries = await checkVisisted();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  
  if (req.body.user) {
    console.log("currentUserId = ", currentUserId);
    currentUserId = req.body.user;
    const countries = await checkVisisted();

    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: "teal",
    });
  } else if (req.body.add) {
    res.render("new.ejs")
  }


});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const nameInput = req.body.name;
  const colorInput = req.body.color;

  await db.query("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM users))"); //reset sequence 

  //await db.query("INSERT INTO users (name,color) VALUES ($1,$2)", [nameInput, colorInput]); //insert new row

  const retrieveId = await db.query("INSERT INTO users (name, color) VALUES ($1,$2) RETURNING id", [nameInput, colorInput]);
  const returnId = retrieveId.rows[0].id;
  console.log("id = ", returnId)
  const selRow = await db.query(`SELECT id,name,color FROM users WHERE id=${returnId}`);
  //console.log("resultSel.rows[3] = ", selRow.rows[3])
  const newUserInput = selRow.rows[0];
  console.log("selRow = ", newUserInput)

  users.push(newUserInput)
  console.log("users = ", users);


  res.redirect("/");


});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
