import { createClient } from "edgedb";
import e from "./dbschema/edgeql-js";

const client = createClient({
  branch: "edgedb",
});

async function run() {
  const query = e.select(e.Movie, (movie) => ({
    title: true,
    release_year: true,
    cast_size: e.count(movie.actors),
    "actors": (actor) => ({
      id: true,
      name: true,
      "@character_name": true,
      order_by: actor.name,
    }),
    filter: e.op(movie.title, "ilike", "%avengers%"),
    order_by: movie.release_year,
  }));

  const result = await query.run(client);
  console.log(JSON.stringify(result, null, 2));
}

run();
