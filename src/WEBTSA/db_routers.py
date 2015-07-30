class DataSeriesRouter(object):
    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'webtsaservices':
            return 'tsa'
        return 'default'

    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'webtsaservices':
            return 'tsa'
        return 'default'
