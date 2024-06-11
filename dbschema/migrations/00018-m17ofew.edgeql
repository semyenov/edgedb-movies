CREATE MIGRATION m17ofewptaqlwfno2asxxwj5ecjoptdhrm5nnfbzc3vf322nfvtstq
    ONTO m1cnvmtzpxpnjvtkdwyfsj6kwxyw54m5wtxxxlcld6gnvwkxgaaxba
{
  ALTER TYPE default::HasInfo {
      ALTER PROPERTY shortname {
          USING (SELECT
              <std::str>(std::array_unpack(std::str_split(.name, ' ')))[0]
          );
      };
  };
};
