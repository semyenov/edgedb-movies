CREATE MIGRATION m1nuuimsvpagkoi7rle5dxvtfagq7ewngk7onb2ywqj5emjml7k4kq
    ONTO m1k5jsvnhbkc4fdoxqk3h47y7uztsdpkcv6kut7p24uvm36gjlcjqa
{
  ALTER TYPE default::User {
      CREATE REQUIRED LINK identity: ext::auth::LocalIdentity {
          SET REQUIRED USING (<ext::auth::LocalIdentity>{});
      };
  };
  ALTER GLOBAL default::current_user USING (std::assert_single((SELECT
      default::User
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
};
