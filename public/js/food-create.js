
(function($,Backbone,_,Handlebars,window,document,undefined){

	var $templates=$("#new-food-templates");

	var IngredientModel=Backbone.Model.extend({
		defaults:{
			name:null,
			composites:null
		},
		initialize:function(options){
			this.composites=new IngredientCollection();
		},
		validate:function(){
			var name=this.get("name");
			if(!name) return "Ingredient name cannot be blank";
			if(this.composites){
				if(this.composites.hasDupes()) return "Composites for ingredient " + name + " has dupes";
				if(!this.composites.isValid()) return "Composites for ingredient " + name + " are invalid";
			}
		}
	});
	var NutritionModel=Backbone.Model.extend({
		defaults:{
			name: null,		// "Protein"
			amount: null 	// "16g"
		},
		validate: function(attributes, options){
			var amount=this.get("amount");
			var name=this.get("name");
			if(amount && name) return;

			return "Nutritions must have an amount and name";
		}
	});
	var IngredientCollection=Backbone.Collection.extend({
		model: IngredientModel,
		hasDupes:function(){
			var seen={};
			dupe=this.find(function(ingredient){
				var name=ingredient.get("name");
				if(!name) return false;
				if(seen[name]) return true;

				seen[name]=1;
				return false;
			});

			return dupe!=null;
		},
		isValid:function(){
			var invalid=this.find(function(ingredient){
				return ingredient.isValid()===false;
			});
			return invalid==null;
		}
	})
	var NutritionCollection=Backbone.Collection.extend({
		model: NutritionModel,
		hasDupes:function(){
			var seen={};
			dupe=this.find(function(nutrition){
				var name=nutrition.get("name");
				if(!name) return false;
				if(seen[name]) return true;

				seen[name]=1;
				return false;
			});

			return dupe!=null;
		},
		isValid:function(){
			var invalid=this.find(function(nutrition){
				return nutrition.isValid()===false;
			});
			return invalid==null;
		}
	});

	// todo - this is more like a view model.
	// when you save to the server, properties like "nutritionCollection" make no sense - 
	// you gotta map to the server model before you save
	var FoodModel=Backbone.Model.extend({
		defaults:{
			name: null,
			nutritionCollection: null,
			ingredientCollection: null
		},
		url:"/foo/bar",
		initialize: function(options){
			this.set("nutritionCollection",new NutritionCollection());
			this.set("ingredientCollection",new IngredientCollection());
		},
		// toJSON: function(){
		// 	pJson=$.extend(Backbone.Model.prototype.toJSON.call(this), {
		// 		nutritionCollection: this.nutritionCollection.toJSON(),
		// 		ingredientCollection: this.ingredientCollection.toJSON()
		// 	});

		// 	return pJson;
		// },
		validate:function(){
			var name=this.get("name");
			if(!name) return "Food name cannot be null";

			var nutritionCollection=this.get("nutritionCollection");
			if(nutritionCollection){
				if(!nutritionCollection.isValid()) return "There are invalid Nutrition elements";
				if(nutritionCollection.hasDupes()) return "There are duplicate Nutrition elements";
			}

			var ingredientCollection=this.get("ingredientCollection");
			if(ingredientCollection){
				if(!ingredientCollection.isValid()) return "There are invalid Ingredients";
				if(ingredientCollection.hasDupes()) return "There are duplicate Ingredients";
			}
		}
	});

	var IngredientModelView=Backbone.View.extend({
		tagName:"li",
		template: Handlebars.compile($templates.find("#new-food-ingredient-model-template").html()),
		initialize:function(options){
			this.listenTo(this.model.composites,"add",this.compositeAdded);
			this.listenTo(this.model,"invalid",this.showInvalidModelError);
		},
		events:{
			"click .remove":function(e){
				this.model.collection.remove(this.model);
				this.remove();
			},
			"keyup .name":function(e){
				if(e.which===13) this.$addButton.click();
			},
			"click .add":function(e){
				var newCompositeName=this.$nameInput.val();
				if(newCompositeName==='') return;

				var newComposite=new IngredientModel({name: newCompositeName});
				this.model.composites.add(newComposite);
				this.$nameInput.val('').focus();
			}
		},
		showInvalidModelError:function(model, error, options){
			this.$errorDiv.html(error);
		},
		compositeAdded:function(model, collection, options){
			var view=new IngredientModelView({model: model});
			this.$listUl.append(view.render().$el);
		},
		initTwoWayBindings:function(){
			this.$addButton=this.$el.find(".add");
			this.$nameInput=this.$el.find(".name");
			this.$listUl=this.$el.find(".composites");
			this.$errorDiv=this.$el.find(".validation-errors");
		},
		render:function(){
			this.$el.html(this.template(this.model.toJSON()));
			this.initTwoWayBindings();
			return this;
		}
	});
	var IngredientView=Backbone.View.extend({
		el: "#new-food-ingredient-view",
		template: Handlebars.compile($templates.find("#new-food-ingredient-template").html()),
		initialize:function(options){
			this.listenTo(this.collection,"add",this.ingredientAdded);
		},
		events:{
			"keyup .name":function(e){
				if(e.which===13) this.$addButton.click();
			},
			"click .add":function(e){
				var newName=this.$nameInput.val();
				if(newName==='') return;

				this.collection.add(new IngredientModel({name:newName}));
				this.$nameInput.val('').focus();
			}
		},
		ingredientAdded:function(model, collection, options){
			var view=new IngredientModelView({model:model});
			this.$listUl.append(view.render().$el);
		},
		initTwoWayBindings:function(){
			this.$errorDiv=this.$el.find(".validation-errors");
			this.$listUl=this.$el.find(".list");
			this.$nameInput=this.$el.find(".name");
			this.$addButton=this.$el.find(".add");
		},
		render: function(){
			this.$el.html(this.template());
			this.initTwoWayBindings();
			return this;
		}
	});

	var NutritionModelView=Backbone.View.extend({
		template: Handlebars.compile($templates.find("#new-food-nutrition-model-template").html()),
		initialize: function(options){
			this.listenTo(this.model, "invalid", this.renderInvalidModelError);
		},
		events:{
			"keyup .amount": function(e){
				if(e.which===13){
					this.$nameInput.focus();
					return;
				}

				this.model.set("amount", e.target.value);
			},
			"keyup .name": function(e){
				if(e.which===13){
					this.$addButton.click();
					return;
				}

				this.model.set("name", e.target.value);
			},
			"click .remove": function(e){
				this.model.collection.remove(this.model);
				this.remove();
			},
			"click .add": function(e){
				this.clearErrors();
				if(!this.model.isValid()){
					this.focus();
					return;
				}

				this.model.collection.add(new NutritionModel());
			}
		},
		focus:function(){
			this.$amountInput.focus();
		},
		clearErrors: function(){
			this.$errorDiv.empty();
		},
		initTwoWayBindings:function(){
			this.$errorDiv=this.$el.find(".validation-errors");
			this.$amountInput=this.$el.find(".amount");
			this.$nameInput=this.$el.find(".name");
			this.$addButton=this.$el.find(".add");
		},
		renderInvalidModelError:function(model, error, options){
			this.$errorDiv.html(error);
		},
		render:function(){
			this.$el.html(this.template(this.model.toJSON()));
			this.initTwoWayBindings();
			return this;
		}
	});
	var NutritionView=Backbone.View.extend({
		el: "#new-food-nutrition-view",
		template: Handlebars.compile($templates.find("#new-food-nutrition-template").html()),
		initialize:function(){
			this.listenTo(this.collection, "add", this.appendNewNutritionView);
			this.listenTo(this.collection, "remove", this.nutritionWasRemoved);
		},
		events:{
			"click .add-nutrition": function(e){
				this.collection.add(new NutritionModel());
			}
		},
		appendNewNutritionView: function(model,collection,options){
			var newView=new NutritionModelView({model:model});
			this.$el.append(newView.render().$el);
			this.$addButton.hide();
			newView.focus();
		},
		nutritionWasRemoved: function(model, collection, options){
			if(this.collection.length <= 0) this.$addButton.show();
		},
		clearErrors:function(){
			this.$errorDiv.empty();
		},
		initTwoWayBindings:function(){
			this.$errorDiv=this.$el.find(".validation-errors");
			this.$addButton=this.$el.find(".add-nutrition");
		},
		render: function(){
			this.$el.html(this.template());
			this.initTwoWayBindings();
			return this;
		}
	});

	var GeneralFoodView=Backbone.View.extend({
		el: "#new-food-general-view",
		template: Handlebars.compile($templates.find("#new-food-general-template").html()),
		events:{
			"keyup .name":function(e){
				this.model.set("name",e.target.value);
			}
		},
		render: function(){
			this.$el.html(this.template());
			return this;
		}
	});

	var FoodView=Backbone.View.extend({
		el: "#new-food-view",
		initialize: function(options){
			this.viewGeneral=new GeneralFoodView({model: this.model});
			this.viewNutritions=new NutritionView({collection: this.model.get("nutritionCollection")});
			this.viewIngredients=new IngredientView({collection: this.model.get("ingredientCollection")});

			this.listenTo(this.model,"invalid",this.showInvalidModelError);
		},
		events:{
			"click .save": function(e){
				this.clearErrors();

				// this will call validate on the model and will not post to server if validation fails
				this.model.save(this.model.toJSON(),{
					success:function(model, response, options){
						alert("success?");
					},
					error:function(model, xhr, options){
						alert("error?");
					}
				});
			}
		},
		showInvalidModelError:function(model,error,options){
			this.$errorUl.append("<li>Error: " + error + "</li>");
		},
		clearErrors:function(){
			this.$errorUl.empty();
		},
		initTwoWayBindings:function(){
			this.$errorUl=this.$el.find(".food-save-error");
		},
		render: function(){
			this.viewGeneral.render();
			this.viewNutritions.render();
			this.viewIngredients.render();

			this.initTwoWayBindings();
			return this;
		}
	});

	var newFoodView=new FoodView({
		model: new FoodModel()
	});
	newFoodView.render();
})(jQuery,Backbone,_,Handlebars,window,document);