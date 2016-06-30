'use strict';

/* jshint -W030 */
var chai = require('chai')
  , expect = chai.expect
  , Support = require(__dirname + '/../../support')
  , dialect = Support.getTestDialect()
  , DataTypes = require(__dirname + '/../../../../lib/data-types')
  , _ = require('lodash');
if (dialect.match(/^postgres/)) {
  describe('[POSTGRES Specific] QueryInterface', function () {
    beforeEach(function () {
      this.sequelize.options.quoteIdenifiers = true;
      this.queryInterface = this.sequelize.getQueryInterface();
    });


    describe('createFunction', function(){

      beforeEach(function(){
        var self = this;
        return self.queryInterface.dropFunction("create_job",[{type:"varchar",name:"test"}]).catch(function(err){
          //function might not be there to start with so suppress the error.
          var notThere = new RegExp("function create_job.*does not exist")
          if(notThere.test(err)) return;
          else throw err;
        })
      })

      it("creates a stored procedure", function(){

        var self = this;
        var body = "return test;";
        var options = {};
        return self.queryInterface.createFunction("create_job", [{type:"varchar",name:"test"}], "varchar", "plpgsql", body, options)
        .then(function(){
            return self.sequelize.query("select create_job('test');", { type: self.sequelize.QueryTypes.SELECT })
            .then(function(res){
              if(res[0].create_job !== 'test') throw new Error("expected output: test");
            })
          })

      });

      it("requires parameters array", function(){
        var self = this;
        var body = "return 1;";
        var options = {};
        try{
          return self.queryInterface.createFunction("create_job",null, "integer", "plpgsql", body, options);
        }catch(err){
          //check if expected error was given... if not throw it up.
          if(/.*function parameters array required.*/.test(err)) return;
          else throw err;
        }

      })


      it("throws an error if called with no parameter type", function(){
        var self = this;
        var body = "return 1;";
        var options = {};
        try{
          return self.queryInterface.createFunction("create_job", [{name:"test"}], "integer", "plpgsql", body, options);
        }catch(err){
          var noType = new RegExp("parameter missing type");
          if(noType.test(err)) return;
          else throw err;
        }
      })

      it("requires returnType", function(){
        var self = this;
        var body = "return 1;";
        var options = {};
        try{
          return self.queryInterface.createFunction("create_job", [{type:"varchar",name:"test"}], null, "plpgsql", body, options);
        }catch(err){
          if(/requires returnType/.test(err)) return;
          else throw err;
        }
      })

      it("requires language", function(){
        var self = this;
        var body = "return 1;";
        var options = {};
        try{
          return self.queryInterface.createFunction("create_job", [{type:"varchar",name:"test"}], "varchar", null, body, options);
        }catch(err){
          if(/requires language/.test(err)) return;
          else throw err;
        }
      })

      it("requires body", function(){
        var self = this;
        var options = {};
        try{
          return self.queryInterface.createFunction("create_job", [{type:"varchar",name:"test"}], "varchar", "plpgsql", null, options);
        }catch(err){
          if(/requires body/.test(err)) return;
          else throw err;
        }
      })


      it("treats options as optional", function(){
        var self = this;
        var body = "return 1;"
        var options = {};
        return self.queryInterface.createFunction("create_job", [{type:"varchar",name:"test"}], "varchar", "plpgsql", body, null);
      })

    });

    describe("dropFunction",function(){


      it("can drop a function", function(){

        //setup the droptest function
        //test it
        //drop the function
        //try it again.
        var self = this;
        var body = "return test;";
        var options = {};
        return self.queryInterface.createFunction("droptest", [{type:"varchar",name:"test"}], "varchar", "plpgsql", body, options)
        .then(function(){

            return self.sequelize.query("select droptest('test');", { type: self.sequelize.QueryTypes.SELECT })
            .then(function(res){
              if(res[0].droptest !== 'test') throw new Error("expected output: test");

              return self.queryInterface.dropFunction("droptest",[{type:"varchar",name:"test"}])
              .then(function(){

                  return self.sequelize.query("select droptest('test');", { type: self.sequelize.QueryTypes.SELECT })
                  .then(function(){
                    throw new Error("function failed to drop")
                  })
                  .catch(function(err){
                    var notThere = new RegExp("function droptest.* does not exist")
                    if(notThere.test(err.message)) return;
                    else throw err;

                  })

              })

            })
          })

      })

      it("requires functionName", function(){
        var self = this;
        try{
          return self.queryInterface.dropFunction();
        }catch(err){
          //check if expected error was given... if not throw it up.
          if(/.*requires functionName.*/.test(err)) return;
          else throw err;
        }

      })
      it("requires parameters array", function(){
        var self = this;
        try{
          return self.queryInterface.dropFunction("dropteset");
        }catch(err){
          //check if expected error was given... if not throw it up.
          if(/.*function parameters array required.*/.test(err)) return;
          else throw err;
        }

      })

      it("throws an error if called with no parameter type", function(){
        var self = this;
        try{
          return self.queryInterface.dropFunction("dropteset", [{name:"test"}]);
        }catch(err){
          //check if expected error was given... if not throw it up.
          var noType = new RegExp("parameter missing type");
          if(noType.test(err)) return;
          else throw err;
        }
      })

    })

    describe("renameFunction", function(){

      it("can rename a function", function(){

      })

      it("requires parameters array")
      it("requires old function name")
      it("requires new function name")

      it("throws an error if called with no parameter type", function(){

      })

    })


    describe('indexes', function () {
      beforeEach(function () {
        var self = this;
        return this.queryInterface.dropTable('Group').then(function () {
          return self.queryInterface.createTable('Group', {
            username: DataTypes.STRING,
            isAdmin: DataTypes.BOOLEAN,
            from: DataTypes.STRING
          });
        });
      });

      it('adds, reads and removes a named functional index to the table', function () {
        var self = this;
        return this.queryInterface.addIndex('Group', [this.sequelize.fn('lower', this.sequelize.col('username'))], {
          name: 'group_username_lower'
        }).then(function () {
          return self.queryInterface.showIndex('Group').then(function (indexes) {
            var indexColumns = _.uniq(indexes.map(function (index) {
              return index.name;
            }));
            expect(indexColumns).to.include('group_username_lower');
            return self.queryInterface.removeIndex('Group', 'group_username_lower').then(function () {
              return self.queryInterface.showIndex('Group').then(function (indexes) {
                indexColumns = _.uniq(indexes.map(function (index) {
                  return index.name;
                }));
                expect(indexColumns).to.be.empty;
              });
            });
          });
        });
      });
    });
  });
}
