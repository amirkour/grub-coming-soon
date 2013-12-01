
(function($,Backbone,_,Handlebars,window,document,undefined){

	var $templates=$("#new-food-templates");

	var IngredientModel=Backbone.Model.extend({
		defaults:{
			name:null,
			composites:null
		}
	});
	var NutritionModel=Backbone.Model.extend({
		defaults:{
			name: null,		// "Protein"
			amount: null 	// "16g"
		},
		validate: function(attributes, options){
			for(var prop in attributes){
				if(!attributes[prop]) return "" + prop + " cannot be empty";
			}
		}
	});
	var IngredientCollection=Backbone.Collection.extend({
		model: IngredientModel
	})
	var NutritionCollection=Backbone.Collection.extend({
		model: NutritionModel
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
		initialize: function(options){
			this.nutritionCollection=new NutritionCollection();
			this.ingredientCollection=new IngredientCollection();
		},
		toJSON: function(){
			pJson=$.extend(Backbone.Model.prototype.toJSON.call(this), {
				nutritionCollection: this.nutritionCollection.toJSON(),
				ingredientCollection: this.ingredientCollection.toJSON()
			});

			return pJson;
		}
	});

	var IngredientView=Backbone.View.extend({
		el: "#new-food-ingredient-view",
		template: Handlebars.compile($templates.find("#new-food-ingredient-template").html()),
		render: function(){
			this.$el.html(this.template());
			return this;
		}
	});

	var NutritionModelView=Backbone.View.extend({
		template: Handlebars.compile($templates.find("#new-food-nutrition-model-template").html()),
		events:{
			"blur .amount": function(e){
				this.clearErrors();
				this.model.set("amount", e.target.value, {validate:true});
			},
			"blur .name": function(e){
				this.clearErrors();
				this.model.set("name", e.target.value, {validate:true});
			},
			"click .remove": function(e){
				this.model.collection.remove(this.model);
				this.remove();
			}
		},
		clearErrors: function(){
			this.$errorDiv.empty();
		},
		initTwoWayBindings:function(){
			this.$errorDiv=this.$el.find(".validation-errors");
			this.listenTo(this.model, "invalid", this.renderInvalidModelError);
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
		events:{
			"click .add-nutrition": function(e){
				this.collection.add(new NutritionModel());
			}
		},
		initialize:function(){
			this.listenTo(this.collection, "add", this.appendNewNutritionView);
		},
		appendNewNutritionView: function(model,collection,options){
			var newView=new NutritionModelView({model:model});
			this.$el.append(newView.render().$el);
		},
		render: function(){
			this.$el.html(this.template());
			return this;
		}
	});

	var GeneralFoodView=Backbone.View.extend({
		el: "#new-food-general-view",
		template: Handlebars.compile($templates.find("#new-food-general-template").html()),
		render: function(){
			this.$el.html(this.template());
			return this;
		}
	});

	var FoodView=Backbone.View.extend({
		el: "#new-food-view",
		events:{
			"click .save": function(e){
				alert("saving");
			}
		},
		initialize: function(options){
			this.viewGeneral=new GeneralFoodView({model: this.model});
			this.viewNutritions=new NutritionView({collection: this.model.nutritionCollection});
			this.viewIngredients=new IngredientView({collection: this.model.ingredientCollection});
		},

		render: function(){
			this.viewGeneral.render();
			this.viewNutritions.render();
			this.viewIngredients.render();
			return this;
		}
	});

	var newFoodView=new FoodView({
		model: new FoodModel()
	});
	newFoodView.render();
})(jQuery,Backbone,_,Handlebars,window,document);