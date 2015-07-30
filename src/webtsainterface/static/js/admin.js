(function($) {
    $(document).ready(function() {
        var fieldSelect = $('#id_keyfield');
        var selectedValueSelect = $('#id_selected');
        emptySelect(selectedValueSelect);

        fieldSelect.on('change', function() {
            var api = window.location.pathname.slice(0, window.location.pathname.indexOf('admin')) + 'api/v1/';
            var selectedField = fieldSelect.children("option").filter(":selected").text();
            $.getJSON(api + "values?field=" + selectedField + "&limit=0").done(function(data) {
                emptySelect(selectedValueSelect);

                data.objects.forEach(function(object) {
                    selectedValueSelect.append($('<option/>', {
                        value: object[selectedField],
                        text : object[selectedField]
                    }));
                });
            });
        });
    });

    function emptySelect(select) {
        select.empty();
        select.append($('<option/>', {
            value: '',
            text : '---'
        }));
    }

}(django.jQuery));