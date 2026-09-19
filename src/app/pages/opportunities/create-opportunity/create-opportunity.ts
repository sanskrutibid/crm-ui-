import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterModule,
  ActivatedRoute
} from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ContactsService } from '../../contacts/contacts.service';
import { OpportunitiesService } from '../opportunities.service';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

// ============================================================
// SOURCE OPTION INTERFACE
// ============================================================

export interface SourceOption {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  type?: 'employee' | 'source';
}

@Component({
  selector: 'app-create-opportunity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './create-opportunity.html',
  styleUrl: './create-opportunity.css'
})
export class CreateOpportunity implements OnInit {

  currentStep: number = 1;

  contacts: any[] = [];

  agents: any[] = [];

  isEditMode: boolean = false;

  opportunityId: string = '';

  // ============================================================
  // KEYWORDS
  // ============================================================

  keywordInput: string = '';

  keywords: string[] = [];

  // ============================================================
  // DYNAMIC REQUIREMENT VISIBILITY
  // ============================================================

  showBedroom: boolean = true;

  showFurnishing: boolean = true;

  showTransaction: boolean = true;

  showPurpose: boolean = true;

  showPropertyAge: boolean = true;

  showArea: boolean = true;

  showBudget: boolean = true;

  showDescription: boolean = true;

  showInternalNote: boolean = true;

  // ============================================================
  // OPPORTUNITY DATA
  // ============================================================

  opportunityData: any = {
    customer: '',
    requestDate: '',
    estCloseDate: '',
    forType: '',
    lookingFor: '',
    budgetMin: '',
    budgetMax: '',
    areaMin: '',
    areaMax: '',
    areaUnit: 'Sq.Ft.',
    city: '',
    locality: '',
    bedroom: '',
    furnishing: '',
    transaction: '',
    purpose: '',
    propertyAge: '',
    description: '',
    internalNote: '',
    purposeStage: '',
    remark: '',
    scheduleDate: '',
    scheduleTime: '14:23',
    whereFollowup: '',
    keyword: '',
    referBy: '',
    folder: '',
    source: '',
    branch: '',
    assignee: '',
    estRevenue: 0.00,
    sendWhatsappToAssignee: false,
    sendEmailToAssignee: false,
    sendWhatsappToCustomer: false,
    sendEmailToCustomer: false,
    isPrivate: true,
    isBranch: false,
    protected: false,
    matchingAlert: false,
    termsShared: false
  };

  // ============================================================
  // FOR OPTIONS
  // ============================================================

  forOptions = [
    'Buy',
    'PG',
    'Rent/Lease',
    'Re-Development',
    'Joint Ventures',
    'Services'
  ];

  // ============================================================
  // LOOKING FOR OPTIONS
  // ============================================================

  lookingForOptions = [
    'Residential Apartment',
    'Residential Independent House / Villa',
    'Residential Independent / Builder Floor',
    'Residential Studio Apartment',
    'Residential Farm House',
    'Guest house/ banquet hall',
    'Residential Row House',
    'Residential Twin Bungalow',
    'Residential Twin Apartment',
    'Residential Duplex',
    'Residential Terrace',
    'Residential Penthouse',
    'Residential Tenement',
    'Residential Bungalow',
    'Residential Triplex',
    'Residential basement',
    'Residential Row Villa',
    'Weekend Villa',
    'Residential Building',
    'Sky Villa',

    'Commercial Serviced Apartment',
    'Commercial Shop',
    'Commercial Showroom',
    'Commercial Office/Space',
    'Commercial Time share',
    'Commercial Space in Retail Mall',
    'Commercial Office in Business Park',
    'Commercial Office in IT Park',
    'Commercial Business centre',
    'Commercial Hotel/ Resort',
    'Commercial Financial Institution',
    'Commercial Medical/Hospital  Premise',
    'Corporate House',
    'Commercial Institutes',
    'Commercial Labor Camp',
    'Commercial Chemical Zone',
    'Commercial Restaurant',
    'Commercial Flat',
    'Commercial Terrace Restaurant',
    'Commercial Education Institutes',
    'Commercial Built to Suit',
    'Home Stay',
    'Commercial Multiplex',
    'Commercial basement',
    'Commercial bungalow',
    'Co-Working Office Spaces',
    'Commercial Shop Cum Office Spaces(SCO)',
    'Commercial Shop Cum Flat(SCF)',
    'Commercial Booth',
    'Commercial Bay Shop',
    'Commercial Building',

    'PG',

    'Special Economic Zone (SEZ)',
    'Cloud Kitchen',
    'Institutional Building',
    'Corporate Building',
    'Educational Building',
    'Hostels',

    'Industrial Cold storage',
    'Industrial Factory',
    'Industrial Manufacturing',
    'Warehouse/Godown',
    'Industrial Building',
    'Industrial Shed/Gala',

    'Residential  Land / Plot',
    'Commercial  Land / Plot',
    'Industrial  Land / Plot',
    'Agricultural Farm/Land',
    'Transfer of Development Rights (TDR)',
    'Party Plot',
    'Amenity Land',
    'Institutional Plot',
    'Corporate Plots',
    'Open Plot',
    'Villa Plot'
  ];

  // ============================================================
  // AREA UNITS
  // ============================================================

  areaUnits = [
    'Sq.Ft.',
    'Sq.Meter',
    'Grounds',
    'Aankadam',
    'Rood',
    'Chataks',
    'Guntha',
    'Ares',
    'Biswa',
    'Acres',
    'Perch',
    'Bigha',
    'Kottah',
    'Hectares',
    'Marla',
    'Kanal',
    'Cents',
    'Sq. Yard',
    'Kanal(CHD)',
    'Marla(CHD)',
    'Ganda',
    'Lecha'
  ];

  // ============================================================
  // BEDROOMS
  // ============================================================

  bedrooms = [
    '1 RK',
    '1 BHK',
    '1.5 BHK',
    '2 BHK',
    '2.5 BHK',
    '3 BHK',
    '3.5 BHK',
    '4 BHK',
    '4.5 BHK',
    '5 BHK',
    '5.5 BHK',
    '6 BHK',
    '6.5 BHK',
    '7 BHK',
    '7.5 BHK',
    '8 BHK +'
  ];

  // ============================================================
  // FURNISHING
  // ============================================================

  furnishingOptions = [
    'Fully Furnished',
    'UnFurnished',
    'Semi Furnished',
    'Ready to Furnished',
    'Bareshell',
    'Warmshell'
  ];

  // ============================================================
  // TRANSACTION
  // ============================================================

  transactionOptions = [
    'New',
    'Resale',
    'Rent',
    'Lease',
    'Pre Launch',
    'Pre Lease/ Pre Rented',
    'Individual',
    'Company',
    'Distress Sale',
    'Group Booking',
    'Individual / Company'
  ];

  // ============================================================
  // PURPOSE STAGE
  // ============================================================

  purposeStageOptions = [
    {
      label: 'Initiated',
      value: '0.00'
    },
    {
      label: 'General Follow-Up',
      value: '25.00'
    },
    {
      label: 'Office Visits [Meeting]',
      value: '26.00'
    },
    {
      label: 'Inspection [Site Visit Planned]',
      value: '50.00'
    },
    {
      label: 'Finalization [Site Visit Completed]',
      value: '75.00'
    },
    {
      label: 'Completed',
      value: '100.00'
    }
  ];

  // ============================================================
  // PURPOSE
  // ============================================================

  purposeOptions = [
    'Bank',
    'Cafe',
    'Cinema',
    'Clinic',
    'Corporate House',
    'Corporate Office',
    'Farm House',
    'Farming',
    'Hospital',
    'Hotel',
    'Investment',
    'Long term investment',
    'Non-Vegetarian',
    'Organic Farming',
    'Own purpose',
    'Petrol Pump',
    'Pharmacy',
    'Restaurant',
    'Retail',
    'Second Home',
    'Vegetarian'
  ];

  // ============================================================
  // PROPERTY AGE
  // ============================================================

  propertyAgeOptions = [
    'Under Construction',
    'Less than 5 years',
    '5 - 10 years',
    '10 - 20 years',
    'More than 20 years',
    'Less than 6 months',
    'Less than 1 years',
    'Less than 18 months',
    'Less than 2 years',
    'Less than 3 years',
    'New',
    'Ready for Sale'
  ];

  // ============================================================
  // LOCALITY
  // ============================================================

  localityOptions = [
    'Manish Nagar',
    'Dharampeth',
    'Pratap Nagar',
    'Besa',
    'Beltarodi',
    'Wardha Road',
    'Sadar',
    'Civil Lines',
    'Trimurti Nagar',
    'Narendra Nagar',
    'Laxmi Nagar',
    'Nandanvan',
    'Mahal',
    'Jaripatka',
    'Mankapur',
    'Koradi Road',
    'Friends Colony',
    'Shankar Nagar',
    'Hingna Road',
    'Omkar Nagar'
  ];

  // ============================================================
  // REFER BY
  // ============================================================

  referByOptions = [
    'Campaigns',
    'Website Form',
    'WhatsApp',
    'Google Search'
  ];

  // ============================================================
  // FOLDER
  // ============================================================

  folderOptions = [
    'Dhantoli Premium Folder',
    'General Folder'
  ];

  // ============================================================
  // SOURCE OPTIONS
  // ============================================================

  sourceOptions: SourceOption[] = [];

  // ============================================================
  // BRANCH
  // ============================================================

  branchOptions = [
    'Global Team',
    'Nagpur Branch'
  ];

  // ============================================================
  // CITY
  // ============================================================

  cityOptions = [
    'Nagpur',
    'Mumbai',
    'Pune',
    'Delhi',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Indore',
    'Jaipur'
  ];

  // ============================================================
  // SERVICES
  // ============================================================

  private http = inject(HttpClient);

  private contactsService =
    inject(ContactsService);

  private opportunitiesService =
    inject(OpportunitiesService);

  private authService =
    inject(AuthService);

  private router =
    inject(Router);

  private route =
    inject(ActivatedRoute);

  // ============================================================
  // ON INIT
  // ============================================================

  ngOnInit(): void {

    const today =
      this.getTodayDate();

    this.opportunityData.requestDate =
      today;

    this.opportunityData.scheduleDate =
      today;

    this.loadContacts();

    this.loadAgents();

    this.loadSourceOptions();

    this.route.params.subscribe(
      params => {

        if (params['id']) {

          this.isEditMode = true;

          this.opportunityId =
            params['id'];

          this.loadOpportunityDetails(
            this.opportunityId
          );
        }
      }
    );

    this.route.queryParams.subscribe(
      params => {

        if (params['contactId']) {

          this.opportunityData.customer =
            params['contactId'];

        }
      }
    );
  }

  // ============================================================
  // CHANGE LOOKING FOR
  // ============================================================

  onLookingForChange(
    selectedValue?: string
  ): void {

    const selected =
      String(
        selectedValue !== undefined
          ? selectedValue
          : this.opportunityData.lookingFor || ''
      )
        .trim()
        .toLowerCase();

    // ==========================================================
    // COMMON FIELDS
    // ==========================================================

    this.showArea = true;
    this.showBudget = true;
    this.showDescription = true;
    this.showInternalNote = true;

    // ==========================================================
    // RESET OPTIONAL FIELDS
    // ==========================================================

    this.showBedroom = false;
    this.showFurnishing = false;
    this.showTransaction = false;
    this.showPurpose = false;
    this.showPropertyAge = false;

    // ==========================================================
    // NOTHING SELECTED
    // ==========================================================

    if (!selected) {

      this.showBedroom = true;
      this.showFurnishing = true;
      this.showTransaction = true;
      this.showPurpose = true;
      this.showPropertyAge = true;

      return;
    }

    // ==========================================================
    // PG
    // ==========================================================

    if (selected === 'pg') {

      this.showBedroom = true;
      this.showFurnishing = true;
      this.showTransaction = true;
      this.showPurpose = true;
      this.showPropertyAge = true;

      return;
    }

    // ==========================================================
    // RESIDENTIAL
    // ==========================================================

    const isResidential =
      selected.startsWith('residential ') &&
      !selected.includes('land / plot');

    if (isResidential) {

      this.showBedroom = true;
      this.showFurnishing = true;
      this.showTransaction = true;
      this.showPurpose = true;
      this.showPropertyAge = true;

      return;
    }

    // ==========================================================
    // LAND / PLOT
    // ==========================================================

    const isLandOrPlot =
      selected.includes('land / plot') ||
      selected.includes('farm/land') ||
      selected.includes('tdr') ||
      selected.includes('party plot') ||
      selected.includes('amenity land') ||
      selected.includes('institutional plot') ||
      selected.includes('corporate plots') ||
      selected.includes('open plot') ||
      selected.includes('villa plot');

    if (isLandOrPlot) {

      this.showBedroom = false;
      this.showFurnishing = false;
      this.showTransaction = true;
      this.showPurpose = true;
      this.showPropertyAge = false;

      return;
    }

    // ==========================================================
    // INDUSTRIAL
    // ==========================================================

    const isIndustrial =
      selected.includes('industrial') ||
      selected.includes('factory') ||
      selected.includes('manufacturing') ||
      selected.includes('warehouse') ||
      selected.includes('cold storage') ||
      selected.includes('shed/gala');

    if (isIndustrial) {

      this.showBedroom = false;
      this.showFurnishing = false;
      this.showTransaction = true;
      this.showPurpose = true;
      this.showPropertyAge = true;

      return;
    }

    // ==========================================================
    // COMMERCIAL / CORPORATE / INSTITUTIONAL
    // ==========================================================

    const isCommercial =
      selected.includes('commercial') ||
      selected.includes('corporate') ||
      selected.includes('institutional') ||
      selected.includes('educational') ||
      selected.includes('home stay') ||
      selected.includes('co-working') ||
      selected.includes('cloud kitchen') ||
      selected.includes('hostels') ||
      selected.includes('special economic zone') ||
      selected.includes('guest house') ||
      selected.includes('banquet hall');

    if (isCommercial) {

      this.showBedroom = false;
      this.showFurnishing = true;
      this.showTransaction = true;
      this.showPurpose = true;
      this.showPropertyAge = true;

      return;
    }

    // ==========================================================
    // DEFAULT
    // ==========================================================

    this.showBedroom = false;
    this.showFurnishing = true;
    this.showTransaction = true;
    this.showPurpose = true;
    this.showPropertyAge = true;
  }

  // ============================================================
  // LOAD OPPORTUNITY DETAILS
  // ============================================================

  loadOpportunityDetails(
    id: string
  ): void {

    this.opportunitiesService
      .getOpportunityById(id)
      .subscribe({

        next: (res: any) => {

          const opp =
            res.data || res;

          this.opportunityData = {

            customer:
              opp.contactId?._id ||
              opp.contactId?.id ||
              opp.contactId ||
              '',

            requestDate:
              opp.requestDate
                ? opp.requestDate.split('T')[0]
                : this.getTodayDate(),

            estCloseDate:
              opp.estCloseDate
                ? opp.estCloseDate.split('T')[0]
                : '',

            forType:
              opp.purpose || '',

            lookingFor:
              opp.lookingFor || '',

            budgetMin:
              opp.minBudget || '',

            budgetMax:
              opp.maxBudget || '',

            areaMin:
              opp.minArea || '',

            areaMax:
              opp.maxArea || '',

            areaUnit:
              opp.areaUnit ||
              'Sq.Ft.',

            city:
              opp.city || '',

            locality:
              opp.locality || '',

            bedroom:
              opp.bedroom || '',

            furnishing:
              opp.furnishing || '',

            transaction:
              opp.transaction || '',

            purpose:
              opp.purposePref || '',

            propertyAge:
              opp.propertyAge || '',

            description:
              opp.description || '',

            internalNote:
              opp.internalNote || '',

            purposeStage:
              opp.schedulePurpose || '',

            remark:
              opp.scheduleRemark ||
              opp.remark ||
              '',

            scheduleDate:
              opp.scheduleDate
                ? opp.scheduleDate.split('T')[0]
                : this.getTodayDate(),

            scheduleTime:
              opp.scheduleTime ||
              '14:23',

            whereFollowup:
              opp.scheduleWhere ||
              opp.whereFollowup ||
              '',

            keyword:
              opp.keyword || '',

            referBy:
              opp.referBy || '',

            folder:
              opp.folder || '',

            source:
              opp.source || '',

            branch:
              opp.branch || '',

            assignee:
              opp.assignedTo?._id ||
              opp.assignedTo?.id ||
              opp.assignedTo ||
              '',

            estRevenue:
              opp.estRevenue || 0,

            sendWhatsappToAssignee:
              !!opp.sendWhatsAppToAssignee,

            sendEmailToAssignee:
              !!opp.sendEmailToAssignee,

            sendWhatsappToCustomer:
              !!opp.sendWhatsAppToCustomer,

            // FIXED:
            // Previously this was incorrectly using
            // opp.sendWhatsAppToCustomer.
            sendEmailToCustomer:
              !!opp.sendEmailToCustomer,

            isPrivate:
              opp.visibility === 'Private',

            isBranch:
              opp.visibility === 'Branch',

            protected:
              opp.protected || false,

            matchingAlert:
              opp.matchingAlert || false,

            termsShared:
              opp.termsShared || false
          };

          // Apply dynamic requirements
          this.onLookingForChange(
            this.opportunityData.lookingFor
          );

          // Load existing keywords
          this.loadKeywords(
            opp.keyword
          );
        },

        error: (err) => {

          console.error(
            'Failed to load opportunity details:',
            err
          );

          alert(
            'Failed to load opportunity details. Please try again.'
          );
        }
      });
  }

  // ============================================================
  // TODAY DATE
  // ============================================================

  getTodayDate(): string {

    const today =
      new Date();

    return today
      .toISOString()
      .split('T')[0];
  }

  // ============================================================
  // LOAD CONTACTS
  // ============================================================

  loadContacts(): void {

    this.contactsService
      .getContacts({
        limit: 500
      })
      .subscribe({

        next: (res: any) => {

          const payload =
            res.data || res;

          this.contacts =
            payload.contacts || [];
        },

        error: (err) => {

          console.error(
            'Failed to load contacts for opportunities creation:',
            err
          );
        }
      });
  }

  // ============================================================
  // LOAD AGENTS
  // ============================================================

  loadAgents(): void {

    this.authService
      .getAgents()
      .subscribe({

        next: (res: any) => {

          this.agents =
            res.data || res;
        },

        error: (err) => {

          console.error(
            'Failed to load agents in opportunity creation:',
            err
          );
        }
      });
  }

  // ============================================================
  // LOAD SOURCE OPTIONS
  // ============================================================

  loadSourceOptions(): void {

    let employees: SourceOption[] = [];

    let normalSources: SourceOption[] = [];

    let employeeLoaded = false;

    let sourcesLoaded = false;

    const combineOptions = () => {

      if (
        !employeeLoaded ||
        !sourcesLoaded
      ) {
        return;
      }

      this.sourceOptions = [
        ...employees,
        ...normalSources
      ];
    };

    this.authService
      .getAgents()
      .subscribe({

        next: (employeeRes: any) => {

          let employeeList: any[] = [];

          if (
            Array.isArray(
              employeeRes
            )
          ) {

            employeeList =
              employeeRes;
          }

          else if (
            Array.isArray(
              employeeRes?.data
            )
          ) {

            employeeList =
              employeeRes.data;
          }

          else if (
            Array.isArray(
              employeeRes?.employees
            )
          ) {

            employeeList =
              employeeRes.employees;
          }

          else if (
            Array.isArray(
              employeeRes?.results
            )
          ) {

            employeeList =
              employeeRes.results;
          }

          employees =
            employeeList

              .filter(
                (employee: any) =>
                  employee &&
                  employee.status !==
                    'Inactive'
              )

              .map(
                (employee: any) => {

                  const firstName =
                    employee.firstName ||
                    '';

                  const lastName =
                    employee.lastName ||
                    '';

                  let fullName =
                    employee.fullName ||
                    '';

                  if (!fullName) {

                    fullName =
                      `${firstName} ${lastName}`.trim();
                  }

                  if (!fullName) {

                    fullName =
                      employee.name ||
                      employee.employeeName ||
                      employee.employeeId ||
                      '';
                  }

                  return {

                    id: String(
                      employee.id ||
                      employee._id ||
                      employee.employeeId ||
                      ''
                    ),

                    employeeId:
                      String(
                        employee.employeeId ||
                        ''
                      ),

                    firstName:
                      String(
                        firstName
                      ),

                    lastName:
                      String(
                        lastName
                      ),

                    fullName:
                      String(
                        fullName
                      ).trim(),

                    type:
                      'employee' as const
                  };
                }
              )

              .filter(
                (
                  employee: SourceOption
                ) =>
                  !!employee.fullName
              );

          employeeLoaded =
            true;

          combineOptions();
        },

        error: (err) => {

          console.error(
            'FAILED TO LOAD EMPLOYEES FOR SOURCE:',
            err
          );

          employees = [];

          employeeLoaded =
            true;

          combineOptions();
        }
      });

    this.authService
      .getSources()
      .subscribe({

        next: (sourceRes: any) => {

          let sourceList: any[] = [];

          if (
            Array.isArray(
              sourceRes
            )
          ) {

            sourceList =
              sourceRes;
          }

          else if (
            Array.isArray(
              sourceRes?.data
            )
          ) {

            sourceList =
              sourceRes.data;
          }

          else if (
            Array.isArray(
              sourceRes?.sources
            )
          ) {

            sourceList =
              sourceRes.sources;
          }

          else if (
            Array.isArray(
              sourceRes?.results
            )
          ) {

            sourceList =
              sourceRes.results;
          }

          else if (
            sourceRes?.data &&
            Array.isArray(
              sourceRes.data.sources
            )
          ) {

            sourceList =
              sourceRes.data.sources;
          }

          normalSources =
            sourceList

              .filter(
                (source: any) =>
                  source.isActive !== false
              )

              .map(
                (
                  source: any,
                  index: number
                ) => {

                  const sourceName =
                    source.name ||
                    source.sourceName ||
                    source.source_name ||
                    source.source ||
                    source.label ||
                    '';

                  return {

                    id: String(
                      source.id ||
                      source._id ||
                      source.sourceId ||
                      `source-${index + 1}`
                    ),

                    employeeId: '',

                    firstName: '',

                    lastName: '',

                    fullName:
                      String(
                        sourceName
                      ).trim(),

                    type:
                      'source' as const
                  };
                }
              )

              .filter(
                (
                  source: SourceOption
                ) =>
                  !!source.fullName
              );

          sourcesLoaded =
            true;

          combineOptions();
        },

        error: (err) => {

          console.error(
            'FAILED TO LOAD NORMAL SOURCES:',
            err
          );

          normalSources = [];

          sourcesLoaded =
            true;

          combineOptions();
        }
      });
  }

  // ============================================================
  // KEYWORD
  // ============================================================

  addKeyword(): void {

    const input =
      (this.keywordInput || '').trim();

    if (!input) {
      return;
    }

    const newKeywords =
      input
        .split(',')
        .map(
          keyword =>
            keyword.trim()
        )
        .filter(
          keyword =>
            !!keyword
        );

    newKeywords.forEach(
      keyword => {

        const alreadyExists =
          this.keywords.some(
            existingKeyword =>
              existingKeyword.toLowerCase() ===
              keyword.toLowerCase()
          );

        if (!alreadyExists) {

          this.keywords.push(
            keyword
          );
        }
      }
    );

    this.keywordInput = '';

    this.opportunityData.keyword =
      this.keywords.join(', ');
  }

  // ============================================================
  // REMOVE KEYWORD
  // ============================================================

  removeKeyword(
    index: number
  ): void {

    if (
      index >= 0 &&
      index < this.keywords.length
    ) {

      this.keywords.splice(
        index,
        1
      );
    }

    this.opportunityData.keyword =
      this.keywords.join(', ');
  }

  // ============================================================
  // LOAD KEYWORDS
  // ============================================================

  loadKeywords(
    keywordValue: any
  ): void {

    this.keywords = [];

    if (
      keywordValue === null ||
      keywordValue === undefined
    ) {

      this.opportunityData.keyword = '';

      return;
    }

    if (
      Array.isArray(
        keywordValue
      )
    ) {

      this.keywords =
        keywordValue
          .map(
            keyword =>
              String(
                keyword
              ).trim()
          )
          .filter(
            keyword =>
              !!keyword
          );

    }

    else {

      this.keywords =
        String(
          keywordValue
        )
          .split(',')
          .map(
            keyword =>
              keyword.trim()
          )
          .filter(
            keyword =>
              !!keyword
          );
    }

    this.keywords =
      this.keywords.filter(
        (
          keyword,
          index,
          array
        ) =>
          array.findIndex(
            item =>
              item.toLowerCase() ===
              keyword.toLowerCase()
          ) === index
      );

    this.opportunityData.keyword =
      this.keywords.join(', ');
  }

  // ============================================================
  // STEP NAVIGATION
  // ============================================================

  goToStep(
    stepNumber: number
  ) {

    this.currentStep =
      stepNumber;
  }

  nextStep() {

    if (
      this.currentStep < 4
    ) {

      this.currentStep++;
    }
  }

  prevStep() {

    if (
      this.currentStep > 1
    ) {

      this.currentStep--;
    }
  }

  // ============================================================
  // CANCEL
  // ============================================================

  cancelForm() {

    if (
      confirm(
        'You want to cancel it?'
      )
    ) {

      const today =
        this.getTodayDate();

      this.opportunityData.customer =
        '';

      this.opportunityData.requestDate =
        today;

      this.opportunityData.scheduleDate =
        today;

      this.keywordInput = '';

      this.keywords = [];

      this.opportunityData.keyword = '';

      this.currentStep =
        1;

      this.router.navigate([
        '/my-opportunities'
      ]);
    }
  }

  // ============================================================
  // SUBMIT / UPDATE
  // ============================================================

  submitOpportunity() {

    const data =
      this.opportunityData;

    if (
      !data.customer
    ) {

      alert(
        'Please select a target customer'
      );

      this.currentStep =
        1;

      return;
    }

    if (
      !data.forType ||
      !data.lookingFor
    ) {

      alert(
        'Please select transaction purpose and property category in Step 2'
      );

      this.currentStep =
        2;

      return;
    }

    if (
      !data.budgetMin ||
      !data.budgetMax ||
      !data.areaMin ||
      !data.areaMax
    ) {

      alert(
        'Please specify budget and area ranges in Step 2'
      );

      this.currentStep =
        2;

      return;
    }

    if (
      !data.source ||
      !data.branch
    ) {

      alert(
        'Please select lead source and branch in Step 4'
      );

      this.currentStep =
        4;

      return;
    }

    this.opportunityData.keyword =
      this.keywords.length > 0
        ? this.keywords.join(', ')
        : '';

    const payload: any = {

      contactId:
        data.customer,

      requestDate:
        data.requestDate,

      estCloseDate:
        data.estCloseDate ||
        undefined,

      purpose:
        data.forType,

      lookingFor:
        data.lookingFor,

      minBudget:
        Number(
          data.budgetMin
        ),

      maxBudget:
        Number(
          data.budgetMax
        ),

      budgetUnit:
        'Lacs',

      minArea:
        Number(
          data.areaMin
        ),

      maxArea:
        Number(
          data.areaMax
        ),

      areaUnit:
        data.areaUnit,

      city:
        data.city ||
        'Nagpur',

      locality:
        data.locality ||
        'Manish Nagar',

      bedroom:
        data.bedroom ||
        undefined,

      furnishing:
        data.furnishing ||
        undefined,

      transaction:
        data.transaction ||
        undefined,

      purposePref:
        data.purpose ||
        undefined,

      propertyAge:
        data.propertyAge ||
        undefined,

      description:
        data.description ||
        undefined,

      internalNote:
        data.internalNote ||
        undefined,

      schedulePurpose:
        data.purposeStage ||
        undefined,

      scheduleRemark:
        data.remark ||
        undefined,

      scheduleDate:
        data.scheduleDate,

      scheduleTime:
        data.scheduleTime,

      scheduleWhere:
        data.whereFollowup ||
        undefined,

      keyword:
        this.keywords.length > 0
          ? this.keywords.join(', ')
          : undefined,

      referBy:
        data.referBy ||
        undefined,

      folder:
        data.folder ||
        undefined,

      source:
        data.source,

      branch:
        data.branch,

      estRevenue:
        Number(
          data.estRevenue
        ) || 0,

      sendWhatsAppToAssignee:
        !!data.sendWhatsappToAssignee,

      sendEmailToAssignee:
        !!data.sendEmailToAssignee,

      sendWhatsAppToCustomer:
        !!data.sendWhatsappToCustomer,

      sendEmailToCustomer:
        !!data.sendEmailToCustomer,

      visibility:
        data.isPrivate
          ? 'Private'
          : 'Branch',

      protected:
        !!data.protected,

      matchingAlert:
        !!data.matchingAlert
    };

    if (
      data.assignee &&
      data.assignee.length === 24
    ) {

      payload.assignedTo =
        data.assignee;
    }

    if (
      this.isEditMode
    ) {

      this.opportunitiesService
        .updateOpportunity(
          this.opportunityId,
          payload
        )
        .subscribe({

          next: (res) => {

            alert(
              'Opportunity Successfully Updated!'
            );

            this.router.navigate([
              '/my-opportunities'
            ]);
          },

          error: (err) => {

            console.error(
              'Failed to update opportunity:',
              err
            );

            const errMsg =
              err.error?.message ||
              err.message ||
              'Check inputs';

            alert(
              'Error updating opportunity: ' +
              (
                Array.isArray(
                  errMsg
                )
                  ? errMsg.join(', ')
                  : errMsg
              )
            );
          }
        });

    }

    else {

      this.opportunitiesService
        .createOpportunity(
          payload
        )
        .subscribe({

          next: (res) => {

            alert(
              'Opportunity Successfully Created!'
            );

            this.router.navigate([
              '/my-opportunities'
            ]);
          },

          error: (err) => {

            console.error(
              'Failed to create opportunity:',
              err
            );

            const errMsg =
              err.error?.message ||
              err.message ||
              'Check inputs';

            alert(
              'Error creating opportunity: ' +
              (
                Array.isArray(
                  errMsg
                )
                  ? errMsg.join(', ')
                  : errMsg
              )
            );
          }
        });
    }
  }
}