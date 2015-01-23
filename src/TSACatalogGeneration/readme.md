###Description###
This folder contains the source code for the Microsoft SQL Server Stored Procedure that generates (and can be used to regularly update) the catalog that underlies the Time Series Analyst web application. The catalog consists of the relevant metadata for a data series, and it is the base for the table that is visible in the 'Datasets' tab. Select fields of the catalog are also used as search facets. In addition, the catalog contains the URL for the web service request to access the data values for visualization and export. 

The stored procedure is based on a CUAHSI ODM database that 1. Has an up-to-date series catalog table, and 2. Has WaterML 1.1 web services deployed. The source code in the file is for the iUTAH GAMUT network, which consists of multiple watersheds and research sites as Networks. Note that this procedure is only for adding local data to the catalog. A different procedure must be followed for adding external (e.g., USGS) data.

The stored procedure first clears the existing catalog table and resets the primary key. Then, an insert statement is used to populate the catalog for a database. The catalog can be populated from multiple databases by duplicating the insert statement with details on the additional database(s).

[TSA_Catalog] is the catalog database. [Catalog] is the schema. [DataSeries] is the table that contains the data catalog. Other tables that are used in the [TSA_Catalog] database are: [SourceDataService], which identifies the data source (e.g., local monitoring network, USGS, etc.) and [VariableLevel], which is a mechanism to indicate variables that should be displayed by default ('Common') vs. those that are hidden ('Uncommon') by default but still accessible.

###Fields and Sources###
The fields in the [DataSeries] table are below. Implemented facets are highlighted in bold.
- SourceDataServiceID: The ID of the data source from the SourceDataService table.  
- **Network**: A name for the network.  
- SiteCode: SiteCode from the ODM SeriesCatalog table.  
- **SiteName**: SiteName from the ODM SeriesCatalog table.  
- Latitude: Latitude from the ODM Sites table.  
- Longitude: Longitude from the ODM Sites table.  
- State: State from the ODM Sites table.  
- County: County from the ODM Sites table.  
- **SiteType**: SiteType from the ODM Sites table.  
- **VariableCode**: VariableCode from the ODM Variables table.  
- **VariableName**: VariableName from the ODM Variables table.  
- **VariableLevel**: VariableLevel from the VariableLevel table.  
- MethodDescription: MethodDescription from the ODM SeriesCatalog table.  
- VariableUnitsName: UnitsName from the ODM Units table.  
- VariableUnitsType: UnitsType from the ODM Units table.  
- VariableUnitsAbbreviation: UnitsAbbreveiation from the ODM Units table.  
- SampleMedium: SampleMedium from the ODM Variables table.   
- ValueType: ValueType from the ODM Variables table.  
- DataType: DataType from the ODM Variables table.  
- **GeneralCategory**: GeneralCategory from the ODM Variables table.  
- TimeSupport: TimeSupport from the ODM Variables table.  
- TimeSupportUnitsName: UnitsName from the ODM Units table.  
- TimeSupportUnitsType: UnitsType from the ODM Units table.  
- TimeSupportUnitsAbbreviation: UnitsAbbreviation from the ODM Units table.  
- QualityControlLevelCode: QualityControlLevelCode from the ODM QualityControlLevels table.   
- **QualityControlLevelDefinition**: Definition from the ODM QualityControlLevels table.  
- QualityControlLevelExplanation: Explanation from the ODM QualityControlLevels table.  
- SourceOrganization: Organization from the ODM Sources table.   
- SourceDescription: SourceDescription from the ODM Sources table.  
- BeginDateTime: BeginDateTime from the ODM SeriesCatalog table.  
- EndDateTime: EndDateTime from the ODM SeriesCatalog table.  
- UTCOffset: Difference of the BeginDateTime and BeginDateTimeUTC from the ODM SeriesCatalog table.  
- NumberObservations: ValueCount from the ODM SeriesCatalog table.  
- DateLastUpdated: EndDateTime from the ODM SeriesCatalog table.  
- IsActive: Set as 1 to indicate that all data series are active.  
- GetDataURL: A concatonated string to provide the web service request based on the web service base URL + SiteCode + VariableCode + MethodID + SourceID + QualityControlLevelID.