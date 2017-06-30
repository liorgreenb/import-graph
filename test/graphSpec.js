let path            = require('path'),
    chai            = require('chai'),
    expect          = chai.expect,
    Graph           = require('../lib/graph'),
    ImportParserMock= require('./mocks/import-parserMock'),
    pathToMockFiles = path.join(process.cwd(),'test','mocks','graph'),
    graph,
    importParserMock,
    testFilesPaths = {
        1: path.join(pathToMockFiles,'1.txt'),
        2: path.join(pathToMockFiles,'2.fix.txt1'),
        3: path.join(pathToMockFiles,'3.fix.txt1'),
        4: path.join(pathToMockFiles,'dir1','4.txt'),
        5: path.join(pathToMockFiles,'dir1','5.fix.txt1'),
        6: path.join(pathToMockFiles,'dir2','6.txt'),
        7: path.join(pathToMockFiles,'dir2','7.txt'),
        8: path.join(pathToMockFiles,'8.txt'),
        9: path.join(pathToMockFiles,'dir1','dir3','9.txt')
    },
    createGraph = options => {
        beforeEach(() => {
            graph = new Graph(importParserMock, Object.assign({
                loadPaths: [pathToMockFiles],
                extensions: ['txt'],
                extensionPrefixes: [],
                dependencyPattern: 'js'
            }, options))
        });
    };

describe('graph', () => {
    beforeEach(() => {
        importParserMock = new ImportParserMock();
    });
    describe('init method with directory', () => {
        createGraph();
        it('should create graph for "txt" files', (done) => {
            graph.init(pathToMockFiles, true)
                .then(() => {
                    expect(Array.from(graph.graph.get(testFilesPaths[1]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[1]).children)).to.deep.equal([testFilesPaths[4]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).parents)).to.deep.equal([testFilesPaths[1]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).children)).to.deep.equal([testFilesPaths[6]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[7]).children)).to.deep.equal([testFilesPaths[8], testFilesPaths[9]]);
                    done();
                }).catch(error => done(error));
        });

        it('should create graph for "txt" and "txt1" files', (done) => {
            graph.extensions.push('txt1');
            graph.init(pathToMockFiles, true)
                .then(() => {
                    console.log("Ready");
                    expect(Array.from(graph.graph.get(testFilesPaths[1]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[1]).children)).to.deep.equal([testFilesPaths[2], testFilesPaths[4]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[2]).parents)).to.deep.equal([testFilesPaths[1]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[2]).children)).to.deep.equal([testFilesPaths[3]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[3]).parents)).to.deep.equal([testFilesPaths[2]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[3]).children)).to.deep.equal([testFilesPaths[5]]);
                    done();
                }).catch(error => done(error));
        });

        it('should create graph for files with a prefix', (done) => {
            graph.extensions.push('txt1');
            graph.extensionPrefixes.push('fix');
            graph.init(pathToMockFiles, true)
                .then(() => {
                    expect(graph.graph.get(testFilesPaths[1])).to.be.undefined;
                    expect(Array.from(graph.graph.get(testFilesPaths[2]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[2]).children)).to.deep.equal([testFilesPaths[3]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[3]).parents)).to.deep.equal([testFilesPaths[2]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[3]).children)).to.deep.equal([testFilesPaths[5]]);
                    done();
                }).catch(error => done(error));
        });
    });

    describe('init method with file', () => {
        createGraph();
        it('should create graph for "txt" files on this file', (done) => {
            graph.init(testFilesPaths[1], false)
                .then(() => {
                    expect(Array.from(graph.graph.get(testFilesPaths[1]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[1]).children)).to.deep.equal([testFilesPaths[4]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).parents)).to.deep.equal([testFilesPaths[1]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).children)).to.deep.equal([testFilesPaths[6]]);
                    expect(graph.graph.get(testFilesPaths[7])).to.be.undefined;
                    expect(graph.graph.get(testFilesPaths[8])).to.be.undefined;
                    expect(graph.graph.get(testFilesPaths[9])).to.be.undefined;
                    done();
                }).catch(error => done(error));
        });

        it('should create graph on a file with parent and child', (done) => {
            graph.init(testFilesPaths[4], false)
                .then(() => {
                    expect(graph.graph.get(testFilesPaths[1])).to.be.undefined;
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).children)).to.deep.equal([testFilesPaths[6]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[6]).children)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[6]).parents)).to.deep.equal([testFilesPaths[4]]);
                    done();
                }).catch(error => done(error));
        });
    });

    describe('visitAncestors method', () => {
        createGraph();
        it('should not visit any ancestors for a parent-less node', (done) => {
            let notInside = true;
            graph.init(testFilesPaths[1], false)
                .then(() => graph.visitAncestors(testFilesPaths[1], node => notInside = false))
                .then(() => {
                    expect(notInside).to.be.true;
                    done();
                })
                .catch(error => done(error));
        });

        it('should not visit all ancestors of a node', (done) => {
            let ancestors = [];
            graph.init(testFilesPaths[1], false)
                .then(() => graph.visitAncestors(testFilesPaths[6], node => ancestors.push(node)))
                .then(() => {
                    expect(ancestors).to.deep.equal([testFilesPaths[4],testFilesPaths[1]]);
                    done();
                })
                .catch(error => done(error));
        });
    });

    describe('visitDescendants method', () => {
        createGraph();
        it('should not visit any descendants for a children-less node', (done) => {
            let notInside = true;
            graph.init(testFilesPaths[1], false)
                .then(() => graph.visitDescendants(testFilesPaths[6], node => notInside = false))
                .then(() => {
                    expect(notInside).to.be.true;
                    done();
                })
                .catch(error => done(error));
        });

        it('should not visit all descendants of a node', (done) => {
            let descendants = [];
            graph.init(testFilesPaths[1], false)
                .then(() => graph.visitDescendants(testFilesPaths[1], node => descendants.push(node)))
                .then(() => {
                    expect(descendants).to.deep.equal([testFilesPaths[4],testFilesPaths[6]]);
                    done();
                })
                .catch(error => done(error));
        });
    });
    
    describe('exclude files', () => {
        createGraph({exclude: ["dir2"]});
        it('should create graph with "dir2" folder excluded', (done) => {
            graph.init(pathToMockFiles, true)
                .then(() => {
                    expect(Array.from(graph.graph.get(testFilesPaths[1]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[1]).children)).to.deep.equal([testFilesPaths[4]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).parents)).to.deep.equal([testFilesPaths[1]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).children)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[7]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[7]).children)).to.deep.equal([]);
                    expect(graph.graph.get(testFilesPaths[7]).include).to.be.false;
                    done();
                }).catch(error => done(error));
        });
    });

    describe('include files', () => {
        createGraph({include: ["dir1", "dir2"]});
        it('should create graph "with" dir1 and "dir2" folders included', (done) => {
            graph.init(pathToMockFiles, true)
                .then(() => {
                    console.log(graph.graph);
                    expect(graph.graph.get(testFilesPaths[1]).include).to.be.false;
                    expect(graph.graph.get(testFilesPaths[4]).include).to.be.true;
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[4]).children)).to.deep.equal([testFilesPaths[6]]);
                    expect(Array.from(graph.graph.get(testFilesPaths[7]).parents)).to.deep.equal([]);
                    expect(Array.from(graph.graph.get(testFilesPaths[7]).children)).to.deep.equal([testFilesPaths[9]]);
                    done();
                }).catch(error => done(error));
        });
    });
});