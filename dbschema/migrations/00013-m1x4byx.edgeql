CREATE MIGRATION m1x4byxkdc54olr2vw4iwetdyh5mwqvp2dd73ibcob3sf3hui7wcxa
    ONTO m1owwhfy3daujjitqd3k6fodoa6yqszi4astv4nzh6jm6arru2jq7a
{
  CREATE ABSTRACT TYPE default::HasInfo {
      CREATE PROPERTY name: std::str;
      CREATE PROPERTY notes: std::str;
      CREATE PROPERTY shortname := (SELECT
          (std::str_split(.name, ' '))[0]
      );
  };
  ALTER TYPE default::User EXTENDING default::HasInfo LAST;
};
