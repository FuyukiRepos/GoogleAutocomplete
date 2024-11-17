import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { Loader } from "@googlemaps/js-api-loader";

export class googleautocomplete
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _context: ComponentFramework.Context<IInputs>;
  private _container: HTMLDivElement;
  private _inputElement: HTMLInputElement;

  private _notifyOutputChanged: () => void;

  private autocomplete: google.maps.places.Autocomplete;
  private fulladdress: any;
  private label: any;
  private coordinates: any;

  private city: any;
  private state: any;
  private zipcode: any;

  /**
   * Empty constructor.
   */
  constructor() {}

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
   * Data-set values are not initialized here, use updateView.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
   * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    const apikey = "your_api_key";

    context.mode.trackContainerResize(true);

    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    this._container = container;
    this.label = "";
    this.fulladdress = "";
    this.coordinates = "";

    this._inputElement = document.createElement("input");
    this._inputElement.setAttribute("id", "addressautocomplete");
    this._inputElement.setAttribute("type", "text");
    this._inputElement.value = this.label;
    this._inputElement.className = "addressAutocomplete";

    this._inputElement.addEventListener("blur", () => {
      if (this.label != this._inputElement.value) {
        this.label = this._inputElement.value;
        this._notifyOutputChanged();
      }
    });

    this._container.appendChild(this._inputElement);

    /**
    if (!window.google || !window.google.maps) {
      let scriptUrl =
        "https://maps.googleapis.com/maps/api/js?libraries=places&language=en&key=" +
        apikey;

      let scriptNode = document.createElement("script");
      scriptNode.setAttribute("type", "text/javascript");
      scriptNode.setAttribute("src", scriptUrl);
      scriptNode.setAttribute("id", "google-maps-script"); // Add an ID for easier checking
      document.head.appendChild(scriptNode);

      scriptNode.onload = () => {
        this.initializeAutocomplete();
        console.log("start");
      };
    } else {
      // Google Maps API is already loaded, initialize Autocomplete
      this.initializeAutocomplete();
      console.log("no load start");
    }*/

    const loader = new Loader({
      apiKey: apikey,
      version: "weekly",
      libraries: ["places"],
    });

    loader
      .load()
      .then(() => {
        // Google Maps API is loaded, initialize Autocomplete
        this.initializeAutocomplete();
      })
      .catch((e) => {
        console.error("Error loading Google Maps API:", e);
      });
  }

  private initializeAutocomplete(): void {
    window.setTimeout(() => {
      this.autocomplete = new google.maps.places.Autocomplete(
        this._inputElement
      );

      this.autocomplete.setComponentRestrictions({ country: ["au"] });

      this.autocomplete.addListener("place_changed", () => {
        let place = this.autocomplete.getPlace();

        if (place == null || place.address_components == null) {
          this.fulladdress = "";
          this.state = "";
          this.coordinates = "";
          this.label = "";
          this._notifyOutputChanged();
          return;
        }

        let streetNumber = "";
        let street = "";
        let country = "";

        for (let i = 0; i < place.address_components.length; i++) {
          let addressComponent = place.address_components[i];
          let componentType = addressComponent.types[0];
          let addressPiece = addressComponent.long_name;

          switch (componentType) {
            case "street_number":
              streetNumber = addressPiece;
              break;
            case "route":
              street = streetNumber + " " + addressPiece;
              break;
            case "locality":
            case "political":
            case "postal_town":
            case "sublocality":
            case "neighborhood":
            case "colloquial_area":
              this.city = addressPiece;
              break;
            case "administrative_area_level_1":
              this.state = addressPiece;
              break;
            case "country":
              country = addressPiece;
              break;
            case "postal_code":
              this.zipcode = addressPiece;
              break;
            default:
              break;
          }
        }
        this.fulladdress = place.formatted_address;

        interface StateAbbreviations {
          [key: string]: string;
        }

        const stateAbbreviations: StateAbbreviations = {
          VICTORIA: "VIC",
          "NEW SOUTH WALES": "NSW",
          QUEENSLAND: "QLD",
          "SOUTH AUSTRALIA": "SA",
          "WESTERN AUSTRALIA": "WA",
          TASMANIA: "TAS",
          "NORTHERN TERRITORY": "NT",
          "AUSTRALIAN CAPITAL TERRITORY": "ACT",
        };

        function getstate(stateName: string) {
          return stateAbbreviations[stateName.toUpperCase()] || stateName;
        }

        this.state = getstate(this.state);

        const depotcheck = this.depotlist.find(
          (depot) => depot.address === this.fulladdress
        );

        const railcheck = this.raillist.find(
          (rail) => rail.address === this.fulladdress
        );

        this.label =
          this.city +
          (this.state ? ", " + this.state : "") +
          (this.zipcode ? " " + this.zipcode : "");

        this._inputElement.value = this.label;

        if (place.geometry && place.geometry.location) {
          this.coordinates = place.geometry.location
            .toString()
            .replace(/[()]/g, "") // Remove parentheses
            .replace(/,\s+/g, ",");
        } else {
          this.coordinates = "";
        }

        this._notifyOutputChanged();
      });
    }, 1000);
  }

  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
   */
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    // Add code to update control view
    //this._container.style.overflow = "hidden";
    //this._container.style.width = "${this._context.mode.allocatedWidth}px";
    //this._container.style.height = "${this._context.mode.allocatedheight}px";

    const depotcheck = this.depotlist.find(
      (depot) => depot.address === this.fulladdress
    );

    const railcheck = this.raillist.find(
      (rail) => rail.address === this.fulladdress
    );

    if (this._context.parameters.labeltype.raw == "Full") {
      this.label = this.fulladdress;
    } else if (this._context.parameters.labeltype.raw == "Header") {
      if (this.fulladdress) {
        this.label =
          this.city +
          (this.state ? ", " + this.state : "") +
          (this.zipcode ? " " + this.zipcode : "");
      } else {
        this.label = "";
      }
    } else {
      if (depotcheck) {
        this.label = depotcheck.name;
      } else if (railcheck) {
        this.label = railcheck.name;
      } else if (this.fulladdress) {
        this.label =
          this.city +
          (this.state ? ", " + this.state : "") +
          (this.zipcode ? " " + this.zipcode : "");
      } else {
        this.label = "";
      }
    }

    if (this._inputElement.value !== this.label) {
      this._inputElement.value = this.label;
    }

    window.setTimeout(() => {
      if (this.coordinates !== this._context.parameters.coordinates.raw) {
        this.geocode(this._context.parameters.coordinates.raw).then(
          (location) => {
            //console.log("outputupdate");
          }
        );
      }
    }, 500);
  }

  /**
   * It is called by the framework prior to a control receiving new data.
   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
   */
  public getOutputs(): IOutputs {
    return {
      fulladdress: this.fulladdress,
      label: this.label,
      state: this.state,
      coordinates: this.coordinates,
      closestdepotBFG:
        this.fulladdress === ""
          ? ""
          : this.findclosestdepot(this.coordinates, "BFG"),
      closestdepotBCD:
        this.fulladdress === ""
          ? ""
          : this.findclosestdepot(this.coordinates, "BCD"),
      raillocation: this.findraillocation(this.state),
    };
  }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
   * i.e. cancelling any pending remote calls, removing listeners, etc.
   */
  public destroy(): void {
    // Add code to cleanup control if necessary
  }

  private findclosestdepot(
    coordinates: any,
    division: any
  ): string | undefined {
    let closestdepot: string | undefined;
    let minDistance = Infinity;

    const filteredDepotList = this.depotlist.filter(
      (depot) => depot.division === division || depot.division === "All"
    );

    const [latitude, longitude] = coordinates.split(",").map(Number);

    for (const depot of filteredDepotList) {
      const distance = this.haversineDistance(
        latitude,
        longitude,
        depot.latitude,
        depot.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestdepot = `${depot.latitude},${depot.longitude}`;
      }
    }
    return closestdepot;
  }

  private findraillocation(state: any): string {
    let raillocation: string = "";

    const filterraillocation = this.raillist.filter(
      (location) => location.state === state
    );

    if (filterraillocation.length > 0) {
      raillocation = `${filterraillocation[0].latitude},${filterraillocation[0].longitude}`;
    }

    return raillocation; // Return empty string if no match is found
  }

  // Function to calculate the distance between two points using the Haversine formula
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Helper function to convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private depotlist = [
    {
      name: "Altona (McColl's Depot)",
      latitude: -37.8468416,
      longitude: 144.7900301,
      address: "8-14 Burns Rd, Altona VIC 3018, Australia",
      division: "All",
    },
    {
      name: "Geelong (McColl's Depot)",
      latitude: -38.17168215288138,
      longitude: 144.36686165281716,
      address: "92-96 Barwon Terrace, South Geelong VIC 3220, Australia",
      division: "All",
    },
    {
      name: "Cobden (McColl's Depot)",
      latitude: -38.32036968334609,
      longitude: 143.0766239441762,
      address: "25 Bond St, Cobden VIC 3266, Australia",
      division: "BFG",
    },
    {
      name: "Pakenham (McColl's Depot)",
      latitude: -38.09729664880114,
      longitude: 145.49515769699042,
      address: "7 Drovers Pl, Pakenham VIC 3810, Australia",
      division: "BFG",
    },
    {
      name: "Tongala (McColl's Depot)",
      latitude: -36.25424238259468,
      longitude: 144.94657559507445,
      address: "1 Eddie Hann Dr, Tongala VIC 3621, Australia",
      division: "BFG",
    },
    {
      name: "Dennington (McColl's Depot)",
      latitude: -38.35398532201246,
      longitude: 142.43783463933002,
      address: "50 Drummond St, Dennington VIC 3280, Australia",
      division: "BFG",
    },
    {
      name: "Shepparton (McColl's Depot)",
      latitude: -36.38884758914319,
      longitude: 145.43272233925538,
      address: "316 Midland Hwy, Orrvale VIC 3631, Australia",
      division: "BFG",
    },
    {
      name: "Korumburra (McColl's Depot)",
      latitude: -38.427412048905154,
      longitude: 145.81112815467384,
      address: "31 Sanders St, Korumburra VIC 3950, Australia",
      division: "BFG",
    },
    {
      name: "Drouin (McColl's Depot)",
      latitude: -38.14257636077639,
      longitude: 145.8571429393218,
      address: "12 Gould St, Drouin VIC 3818, Australia",
      division: "BFG",
    },
    {
      name: "Bomaderry (McColl's Depot)",
      latitude: -34.851948585403484,
      longitude: 150.6113394865057,
      address: "44 Railway St, Bomaderry NSW 2541, Australia",
      division: "All",
    },
    {
      name: "Prestons (McColl's Depot)",
      latitude: -33.93156713105434,
      longitude: 150.87009569698773,
      address: "115-121 Jedda Rd, Prestons NSW 2170, Australia",
      division: "All",
    },
    {
      name: "Rocklea (McColl's Depot)",
      latitude: -27.561257594233755,
      longitude: 153.00274779663417,
      address: "72 Shettleston St, Rocklea QLD 4106, Australia",
      division: "All",
    },
    {
      name: "Wattlegrove (McColl's Depot)",
      latitude: -32.009238106954356,
      longitude: 115.99364852376084,
      address: "665 Welshpool Rd E, Wattle Grove WA 6107, Australia",
      division: "All",
    },
  ];

  private raillist = [
    {
      name: "Pacific National (VIC)",
      latitude: -37.802185091376955,
      longitude: 144.9178925971561,
      address: "Gate R, 376 Dynon Rd, West Melbourne VIC 3003, Australia",
      state: "VIC",
    },
    {
      name: "Pacific National (NSW)",
      latitude: -33.88867674844518,
      longitude: 151.04340999886549,
      address: "20 Dasea St, Chullora NSW 2190, Australia",
      state: "NSW",
    },
    {
      name: "Pacific National (QLD)",
      latitude: -27.573377279607588,
      longitude: 153.02920288332237,
      address: "8 Kerry Rd, Acacia Ridge QLD 4110, Australia",
      state: "QLD",
    },
    {
      name: "Pacific National (SA)",
      latitude: -34.8680380244535,
      longitude: 138.576349810541,
      address: "Pedder Cres, Regency Park SA 5010, Australia",
      state: "SA",
    },
    {
      name: "Pacific National (WA)",
      latitude: -31.983456369793245,
      longitude: 115.95858106811427,
      address: "4 Fenton St, Kewdale WA 6105, Australia",
      state: "WA",
    },
  ];

  private geocode(request: any): Promise<any> {
    if (request == "") {
      this.fulladdress = "";
      this.city = "";
      this.state = "";
      this.coordinates = "";
      this.label = "";
      this._notifyOutputChanged();
      return Promise.resolve(); // Resolve immediately if no geocoding is needed
    }

    const geocoder = new google.maps.Geocoder();
    const [lat, lng] = request.split(",").map(Number);

    // Return a promise that resolves to only the location (lat, lng)
    return geocoder
      .geocode({ location: { lat: lat, lng: lng } })
      .then((result) => {
        const { results } = result;
        const location = results[0].geometry.location;
        const components = results[0].address_components;

        components.forEach((component) => {
          if (component.types.includes("locality")) {
            this.city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            this.state = component.short_name; // or `long_name` if you prefer the full name
          }
          if (component.types.includes("postal_code")) {
            this.zipcode = component.long_name;
          }
        });

        this.fulladdress = results[0].formatted_address;
        this.coordinates = location
          .toString()
          .replace(/[()]/g, "") // Remove parentheses
          .replace(/,\s+/g, ",");

        const depotcheck = this.depotlist.find(
          (depot) => depot.address === this.fulladdress
        );

        const railcheck = this.raillist.find(
          (rail) => rail.address === this.fulladdress
        );

        if (this._context.parameters.labeltype.raw == "Full") {
          this.label = this.fulladdress;
        } else if (this._context.parameters.labeltype.raw == "Header") {
          if (this.fulladdress) {
            this.label =
              this.city +
              (this.state ? ", " + this.state : "") +
              (this.zipcode ? " " + this.zipcode : "");
          } else {
            this.label = "";
          }
        } else {
          if (depotcheck) {
            this.label = depotcheck.name;
          } else if (railcheck) {
            this.label = railcheck.name;
          } else if (this.fulladdress) {
            this.label =
              this.city +
              (this.state ? ", " + this.state : "") +
              (this.zipcode ? " " + this.zipcode : "");
          } else {
            this.label = "";
          }
        }

        if (this._inputElement.value !== this.label) {
          this._inputElement.value = this.label;
        }
        this._notifyOutputChanged();
      });
  }
}
