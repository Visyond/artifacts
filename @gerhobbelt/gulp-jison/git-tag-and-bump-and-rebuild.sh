#! /bin/bash
#

# ---------------------------------------------------------------------------


pushd $(dirname $0)                                                                                             2> /dev/null  > /dev/null


# to emulate GOTO: we run a loop and BREAK out of it:
while true; do


# ---------------------------------------------------------------------------
# stage 1: rebuild all libraries from scratch, using existing NPM packages.
#          Commit.
# ---------------------------------------------------------------------------

rm -rf node_modules

if !        npm install                 ; then break; fi;           # GOTO END on failure

if !        npm test                    ; then break; fi;           # GOTO END on failure

git commit -a -m 'ready repo for tagging'
git push --all


# ---------------------------------------------------------------------------
# stage 2: Tag and Publish.
# ---------------------------------------------------------------------------

if [ -f package.json ]; then
  node -e 'var pkg = require("./package.json"); console.log(pkg.version);' | xargs git tag
else
  echo "This repo doesn't come with a package.json file"
  break
fi

#if !        npm publish                 ; then break; fi;           # GOTO END on failure



# ---------------------------------------------------------------------------
# stage 3: Bump build revision for future work, commit & push.
# ---------------------------------------------------------------------------


if !        npm version --no-git-tag-version prerelease                       ; then break; fi;           # GOTO END on failure

git commit -a -m 'bumped build revision'
git push --all
git push --tags



# ---------------------------------------------------------------------------
# stage 4: update NPM packages, if any; rebuild & commit
# ---------------------------------------------------------------------------


ncu -a --packageFile package.json 
git commit -a -m 'updated NPM packages'
git push --all



rm -rf node_modules

if !        npm install                 ; then break; fi;           # GOTO END on failure

if !        npm test                    ; then break; fi;           # GOTO END on failure

git commit -a -m 'rebuilt library files'
git push --all



echo "Done. You can now continue work on the new version:"
node -e 'var pkg = require("./package.json"); console.log(pkg.version);'


# end of BREAK-as-emulation-of-GOTO loop:
break
done


popd                                                                                                          2> /dev/null  > /dev/null


