CREATE MIGRATION m1k5jsvnhbkc4fdoxqk3h47y7uztsdpkcv6kut7p24uvm36gjlcjqa
    ONTO m1x4byxkdc54olr2vw4iwetdyh5mwqvp2dd73ibcob3sf3hui7wcxa
{
  ALTER GLOBAL default::current_user USING (std::assert_single((SELECT
      default::User
  )));
  ALTER TYPE default::User {
      DROP LINK identity;
  };
};
