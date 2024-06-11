CREATE MIGRATION m1lxhdrgnltjwh7xzstxeuusw5kjul4ffc7wvm7ucwssajmy2pc47a
    ONTO m1k5jsvnhbkc4fdoxqk3h47y7uztsdpkcv6kut7p24uvm36gjlcjqa
{
  ALTER TYPE default::User {
      CREATE REQUIRED LINK identity: ext::auth::LocalIdentity {
          SET REQUIRED USING (INSERT
              ext::auth::LocalIdentity
              {
                  issuer := 'local',
                  subject := <std::str>.id
              });
      };
  };
  ALTER GLOBAL default::current_user USING (std::assert_single((SELECT
      default::User
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
};
