CREATE MIGRATION m1cnvmtzpxpnjvtkdwyfsj6kwxyw54m5wtxxxlcld6gnvwkxgaaxba
    ONTO m16wjtspsiprfrdymqgpmszwd63dmofggarrted7kstpuvlx4dalpa
{
  ALTER TYPE default::User {
      ALTER LINK identity {
          SET TYPE ext::auth::Identity;
      };
  };
};
