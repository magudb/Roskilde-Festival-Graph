<script>
export default {

    data() {
        return {           
			selection:"",		
			bestMatch:""
        }
    },
	props:["name", "label"],  
    methods: {
        change() {
			var self =this;
            if (this.open == false) {
                this.open = true;
                this.current = 0;
            }	
			 var model = {
				text:this.selection
			}
			if(!this.selection || !this.selection.length>0){
				return [];
			}
			return this.$http.post('http://localhost:3000/autocomplete',model)
			.then((response)=>{								
				return response.body.suggestions;			
			 })
			.then((json)=>{				
				self.bestMatch = json[0].toUpperCase();
				return json;
			})
			.catch(err=> {throw (err)});		
        },
		enter(){
			this.selection = this.bestMatch;
			this.$store.dispatch("AddBand", this.bestMatch);
		}
      
    }
}

</script>
<template>
<div :id="name">
	<label>{{label}}</label>
    <input class="form-control input" type="text" v-model="selection"  @input = 'change' @keydown.enter = 'enter' @keydown.tab = 'enter' />
	<input type="text" class="form-control result" v-model="bestMatch" tabindex="-1">    
</div>
</template>
<style scoped>
	.form-control.input{
		position:relative;
		 background: transparent;
  		color: #666;	
		z-index:1001;
		font-weight:bold;
		text-transform: uppercase;
		
	}
	.form-control.result{
		position:relative;
		z-index: 1000;
		color: #bebebe;
		font-weight:bold;
		transform: translate(0px, -37px);
		text-transform: uppercase;
	}
</style>
