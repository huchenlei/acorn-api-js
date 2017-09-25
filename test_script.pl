# Used by package.json test script
use strict;
use warnings;

# to run all test, invoke `npm test -- "*"`
my $module_name = $ARGV[0];
system "mocha -r ts-node/register ./test/$module_name.spec.ts";