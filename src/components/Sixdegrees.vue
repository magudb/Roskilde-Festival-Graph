<template>
<div class="row">
      <div class="col-md-4">
     {{bands.a}}
    </div>
    <div class="col-md-4">
      
    </div>
    <div class="col-md-4">
      {{bands.b}}
    </div>
</div>

</template>

<script>
  var mapGetters = require("vuex").mapGetters
export default {
   computed:
    mapGetters({
          bands: 'bands'
    }),
  data() {
    return {
     
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
