
(function($,Backbone,_,Handlebars,window,document,undefined){

	var $templates=$("#new-food-templates");

	var IngredientModel=Backbone.Model.extend({
		defaults:{
			name:null,
			composites:null
		},
		initialize:function(options){
			this.set("composites", new IngredientCollection());
		},
		validate:function(){
			var name=this.get("name");
			if(!name) return "Ingredient name cannot be blank";

			var composites=this.get("composites");
			if(composites){
				if(composites.hasDupes()) return "Composite ingredients cannot have dupes";
				if(!composites.isValid()) return "Composites ingredients are invalid";
			}
		}
	});
	var NutritionModel=Backbone.Model.extend({
		defaults:{
			calories: null,
			total_fat: null,
			sat_fat:null,
			cholesterol:null,
			sodium:null,
			potassium:null,
			total_carbs:null,
			fiber:null,
			sugar:null,
			protein:null
		},
		validate: function(attributes, options){
			//todo - do i need this?
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
	});

	// todo - this is more like a view model.
	// when you save to the server, properties like "nutritionCollection" make no sense - 
	// you gotta map to the server model before you save
	var FoodModel=Backbone.Model.extend({
		defaults:{
			name: null,
			nutrition: null,
			ingredients: null
		},
		url:"/service/food",
		initialize: function(options){
			this.set("nutrition",new NutritionModel());
			this.set("ingredients",new IngredientCollection());
		},
		validate:function(){
			var name=this.get("name");
			if(!name) return "Food name cannot be null";

			var nutrition=this.get("nutrition");
			if(nutrition){
				if(!nutrition.isValid()) return "There are invalid Nutrition elements";
			}

			var ingredients=this.get("ingredients");
			if(ingredients){
				if(!ingredients.isValid()) return "There are invalid Ingredients";
				if(ingredients.hasDupes()) return "There are duplicate Ingredients";
			}
		}
	});

	var IngredientModelView=Backbone.View.extend({
		tagName:"li",
		template: Handlebars.compile($templates.find("#new-food-ingredient-model-template").html()),
		initialize:function(options){
			this.listenTo(this.model.get("composites"),"add",this.compositeAdded);
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
				this.model.get("composites").add(newComposite);
				this.$nameInput.val('').focus();
			}
		},
		showInvalidModelError:function(model, error, options){
			this.$errorDiv.html(error);
		},
		compositeAdded:function(model, collection, options){
			var view=new IngredientModelView({model: model});
			this.$listOl.append(view.render().$el);
		},
		initTwoWayBindings:function(){
			this.$addButton=this.$el.find(".add");
			this.$nameInput=this.$el.find(".name");
			this.$listOl=this.$el.find(".composites");
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
			this.$listOl.append(view.render().$el);
		},
		initTwoWayBindings:function(){
			this.$errorDiv=this.$el.find(".validation-errors");
			this.$listOl=this.$el.find(".list");
			this.$nameInput=this.$el.find(".name");
			this.$addButton=this.$el.find(".add");
		},
		render: function(){
			this.$el.html(this.template());
			this.initTwoWayBindings();
			return this;
		}
	});

	var NutritionView=Backbone.View.extend({
		el: "#new-food-nutrition-view",
		template: Handlebars.compile($templates.find("#new-food-nutrition-template").html()),
		events:{
			"keyup .calories":function(e){
				if(e.which===13) this.$total_fat.focus();
				if(e.target.value==='') return;

				this.model.set("calories", e.target.value);
			},
			"keyup .total_fat":function(e){
				if(e.which===13) this.$sat_fat.focus();
				if(e.target.value==='') return;

				this.model.set("total_fat",e.target.value);
			},
			"keyup .sat_fat":function(e){
				if(e.which===13) this.$cholesterol.focus();
				if(e.target.value==='') return;

				this.model.set("sat_fat",e.target.value);
			},
			"keyup .cholesterol":function(e){
				if(e.which===13) this.$sodium.focus();
				if(e.target.value==='') return;

				this.model.set("cholesterol",e.target.value);
			},
			"keyup .sodium":function(e){
				if(e.which===13) this.$potassium.focus();
				if(e.target.value==='') return;

				this.model.set("sodium",e.target.value);
			},
			"keyup .potassium":function(e){
				if(e.which===13) this.$total_carbs.focus();
				if(e.target.value==='') return;

				this.model.set("potassium",e.target.value);
			},
			"keyup .total_carbs":function(e){
				if(e.which===13) this.$fiber.focus();
				if(e.target.value==='') return;

				this.model.set("total_carbs",e.target.value);
			},
			"keyup .fiber":function(e){
				if(e.which===13) this.$sugar.focus();
				if(e.target.value==='') return;

				this.model.set("fiber",e.target.value);
			},
			"keyup .sugar":function(e){
				if(e.which===13) this.$protein.focus();
				if(e.target.value==='') return;

				this.model.set("sugar",e.target.value);
			},
			"keyup .protein":function(e){
				if(e.target.value==='') return;

				this.model.set("protein",e.target.value);
			}
		},
		initTwoWayBindings:function(){
			this.$calories=this.$el.find(".calories");
			this.$total_fat=this.$el.find(".total_fat");
			this.$sat_fat=this.$el.find(".sat_fat");
			this.$cholesterol=this.$el.find(".cholesterol");
			this.$sodium=this.$el.find(".sodium");
			this.$potassium=this.$el.find(".potassium");
			this.$total_carbs=this.$el.find(".total_carbs");
			this.$fiber=this.$el.find(".fiber");
			this.$sugar=this.$el.find(".sugar");
			this.$protein=this.$el.find(".protein");
		},
		render: function(){
			this.$el.html(this.template(this.model.toJSON()));
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
			this.viewnutrition=new NutritionView({model: this.model.get("nutrition")});
			this.viewIngredients=new IngredientView({collection: this.model.get("ingredients")});

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
			this.viewnutrition.render();
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