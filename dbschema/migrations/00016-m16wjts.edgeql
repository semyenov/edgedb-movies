CREATE MIGRATION m16wjtspsiprfrdymqgpmszwd63dmofggarrted7kstpuvlx4dalpa
    ONTO m1lxhdrgnltjwh7xzstxeuusw5kjul4ffc7wvm7ucwssajmy2pc47a
{
  ALTER TYPE default::HasInfo {
      ALTER PROPERTY shortname {
          USING (SELECT
              (std::array_unpack(std::str_split(.name, ' ')))[0]
          );
      };
  };
};
