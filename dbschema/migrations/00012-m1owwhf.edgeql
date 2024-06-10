CREATE MIGRATION m1owwhfy3daujjitqd3k6fodoa6yqszi4astv4nzh6jm6arru2jq7a
    ONTO m1wvofp2esgc37rl5dz45a7qy4ljth7urifbjdtnl3tfwzbrqptsbq
{
  ALTER TYPE default::Account RENAME TO default::User;
  ALTER TYPE default::User {
      CREATE REQUIRED LINK identity: ext::auth::Identity {
          SET REQUIRED USING (<ext::auth::Identity>{});
      };
  };
  CREATE GLOBAL default::current_user := (std::assert_single((SELECT
      default::User
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
};
