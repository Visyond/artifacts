
all: build test

prep: npm-install

npm-install:
	npm install

build:
	@[ -a  node_modules/.bin/jison ] || echo "### FAILURE: Make sure you have run 'make prep' before as the jison compiler is unavailable! ###"
	sh node_modules/.bin/jison bnf.y bnf.l
	mv bnf.js parser.js

	sh node_modules/.bin/jison ebnf.y
	mv ebnf.js transform-parser.js

test:
	node tests/all-tests.js


# increment the XXX <prelease> number in the package.json file: version <major>.<minor>.<patch>-<prelease>
bump:
	npm version --no-git-tag-version prerelease

git-tag:
	node -e 'var pkg = require("./package.json"); console.log(pkg.version);' | xargs git tag





clean:
	-rm -f parser.js
	-rm -f transform-parser.js
	-rm -f bnf.js
	-rm -f ebnf.js
	-rm -rf node_modules/

superclean: clean
	-find . -type d -name 'node_modules' -exec rm -rf "{}" \;



.PHONY: all prep npm-install build test clean superclean bump git-tag
