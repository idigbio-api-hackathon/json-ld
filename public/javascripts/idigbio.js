jQuery(document).ready(function($) {

    $('#search_form').submit(function(evt) {

        evt.preventDefault();

        var sci_name = $('#search_string').val();
        if(3 > sci_name.length || '' == sci_name || undefined == typeof sci_name ) { return; }

        $.ajax({
            type: "get",
            url: "http://localhost:3000/scientific_name_link/" + sci_name,
            success: function(data) {
                console.log('weeee');

                console.log(data);

                $('#json').html(data);

            }
        });

    });

});
