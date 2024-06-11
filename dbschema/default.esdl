using extension graphql;
using extension auth;
using extension ai;

module default {
  global current_user := (
    assert_single((
      select User
      filter .identity = global ext::auth::ClientTokenIdentity
    ))
  );

  abstract type HasInfo {
    name: str;
    notes: str;
    shortname := (select <str>array_unpack(str_split(.name, ' '))[0]);
  }

  type User extending HasInfo {
    required username: str { constraint exclusive; };
    required identity: ext::auth::Identity;
    multi link watchlist: Content;
  }

  abstract type Content {
    required title: str { constraint exclusive; };
    multi link actors: Person {
     character_name: str;
    };
  }

  type Movie extending Content {
    link director: Person;
    release_year: int64;
  }

  type TVShow extending Content {
   num_seasons: int64;
  }

  type Person {
    required name: str;
    multi link acted_in := .<actors[is Content];
    multi link directed := .<director[is Movie];
  }
}

