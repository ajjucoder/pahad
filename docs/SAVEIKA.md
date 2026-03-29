**SAVEIKA**

*An AI-Powered Mental Health Early Warning System for Nepal*

# **1\. Core Idea**

Saveika is a mobile decision-support tool designed to activate Nepal's existing network of 52,000+ Female Community Health Volunteers (FCHVs) as a proactive mental health early warning system.  Nepal already has the human infrastructure to tackle its mental health crisis. 52,000 FCHVs visit every ward in the country. Saveika gives them a structured digital tool to do what they already do “observe and report” but with AI-powered risk scoring and supervisor escalation pathways. 

# **2\. FCHV Background & Research Foundation**

## **2.1 Who FCHVs Are?**

Nepal's Female Community Health Volunteer (FCHV) program is one of the largest and most effective community health systems in South Asia. Launched in the late 1980s and scaled through the 1990s, the program contributed significantly to Nepal achieving its Millennium Development Goal targets for maternal and child mortality.

 

| Characteristic | Detail |
| :---- | :---- |
| Total number | 52,000+ active FCHVs across Nepal |
| Coverage | At least 1 per ward: roughly 1 per 500 people |
| Selection criteria | Must be married, must reside in the ward they serve |
| Compensation | Unpaid volunteers; minimal event-based incentives only |
| Education level | Variable; tools must not require high literacy |
| Visit cadence | Monthly household visits as part of standard FCHV duty |
| Existing MH training | 938+ FCHVs trained in mhGAP modules as of 2022 (fraction of total) |

 

## **2.2 Mental Health in Nepal.**

 

| Metric | Figure |
| :---- | :---- |
| People in Nepal living with mental disorders | 3.9 million |
| Who actually seek professional help | 3.5% (96.5% never seek help) |
| Psychiatrists per 100,000 population | 0.22 (WHO global average: 1.27) |
| FCHVs available for task-shifted care | 52,000+, covering every ward |
| Existing digital MH tools for FCHVs | 0 |

 

## **2.3 Key Research Sources**

1\.      Luitel et al. (2017). Development and psychometric validation of the Community Informant Detection Tool (CIDT). Conflict and Health, 11(1). [https://conflictandhealth.biomedcentral.com/articles/10.1186/s13031-017-0132-y](https://conflictandhealth.biomedcentral.com/articles/10.1186/s13031-017-0132-y)

2\.      WHO (2023). mhGAP Guideline for Mental, Neurological and Substance Use Disorders (3rd Ed.). [https://www.who.int/publications/i/item/9789240084278](https://www.who.int/publications/i/item/9789240084278)

3\.      WHO (2019). mhGAP Community Toolkit (Field Test Version). [https://www.who.int/publications/i/item/the-mhgap-community-toolkit-field-test-version](https://www.who.int/publications/i/item/the-mhgap-community-toolkit-field-test-version)

4\.      WHO (1994). A User's Guide to the Self Reporting Questionnaire (SRQ-20). [https://apps.who.int/iris/handle/10665/61113](https://apps.who.int/iris/handle/10665/61113)

5\.      Nepal Ministry of Health and Population (2022). Mental Health Policy and Action Plan 2080-2087 (2023-2030).

 

# **3\. Prior Work**

Yes, prior evidence validates the concept; the gap Saveika fills is the digitization, quantification, and supervisor layer. Below is a structured review of the most relevant prior work.

## **3.1 Community Informant Detection Tool (CIDT)**

Developed by TPO Nepal, the CIDT is a paper-based proactive case detection tool using illustrated vignettes (picture cards) to help community volunteers identify households with signs of depression, psychosis, alcohol use disorder, epilepsy, and suicidality. It was validated in Nepal and is the closest existing analogue to Saveika.

 

| Dimension | CIDT (Paper) | Saveika (Digital) |
| :---- | :---- | :---- |
| Detection method | Illustrated vignette recognition | Behavioral signal rating scale |
| Risk output | Categorical (yes/no per disorder) | 0-100 score \+ 4-level risk band |
| Language | Nepali (paper) | Nepali \+ English toggle |
| Supervisor visibility | Manual reporting, delayed | Real-time dashboard \+ map |
| Offline capability | Fully offline (paper) | Simulated offline (PWA \+ sync) |
| Proven outcome | \+47% help-seeking (RCT, 2020\) | (to be measured) |

 

## **3.2 The SMS Digitization Attempt (2017)**

A 2017 pilot attempted to move CIDT data collection to SMS on basic feature phones:

 

•        Accuracy dropped considerably compared to paper, especially among older FCHVs and those with lower education

•        Key failure mode: SMS required FCHVs to type codes rather than select from visual options

 

 

 

## **3.3 Nepal Ministry of Health FCHV Mental Health Training**

Nepal's Ministry of Health has already begun integrating mental health into FCHV training through the mhGAP framework:

•        Two-day mhGAP orientation trainings conducted across 55 districts

•        Topics covered: anxiety, depression, alcohol use, psychosis, suicidal ideation

•        938+ FCHVs trained as of 2022, representing under 2% of the total workforce

•        Gap: no structured digital tool to operationalize what FCHVs learn in training during actual home visits

 

# **4\. International Standards Alignment**

## **4.1 WHO mhGAP (Primary Standard)**

The WHO Mental Health Gap Action Programme (mhGAP) is the primary international standard Saveika is built on. The mhGAP Guideline (3rd Edition, 2023\) includes 30 updated and 18 new recommendations across 90+ total guidance points, all specifically designed for non-specialist health workers in low- and middle-income countries.

 

| mhGAP Module | Saveika Signal Mapping |
| :---- | :---- |
| Depression | Sleep changes, appetite changes, stopped activities, expressed hopelessness, social withdrawal |
| Psychosis | Talking to self, strange beliefs, confused speech (Q8) |
| PTSD / Acute Stress | Recent loss or trauma (Q6), visible signs of fear or flashbacks (Q7) |
| Alcohol & Substance Use | Increase in substance use (Q9), family neglect due to substance use (Q10) |
| Suicide & Self-Harm | Self-harm indicators (Q11), expressed wish to die (Q12) — both trigger mandatory critical flag |

 

## **4.2 WHO SRQ-20 (Questionnaire Validation Standard)**

The Self Reporting Questionnaire (SRQ-20) is the WHO standard for mental health screening in LMIC primary healthcare settings.

 

| SRQ-20 Property | Saveika Adaptation |
| :---- | :---- |
| Self-report (person answers about self) | Observer-report (FCHV rates what they observe) |
| Yes/No binary responses | 0-3 severity scale (not observed → severe) |
| 20 questions covering somatic, anxiety, depression | 12 questions focused on behaviorally observable signals |
| Validated in Nepal (Nepali translation) | Signals drawn from validated SRQ-20 domains |
| Cut-off score for case identification | Weighted risk bands with clinical action thresholds |

 

 

**SRQ-20 Example Questions (Nepali Language)**

The following illustrates how SRQ-20 style questions are adapted in Nepali for the Saveika observational format. The FCHV reads and rates each item based on what they observe during the home visit.

 

| प्रश्न (Question) | विकल्पहरू (Options) |
| :---- | :---- |
| प्र. १: के यस व्यक्तिको निद्रामा परिवर्तन देखिएको छ? (Q1: Has sleep changes been observed in this person?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३        गम्भीर / लगातार (Severe / persistent) |
| प्र. २: के यस व्यक्तिले खाना खान छाडेको वा वजन घटेको/बढेको देखिन्छ? (Q2: Have appetite or weight changes been observed?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. ३: के यस व्यक्तिले दैनिक काम वा घरको काम गर्न छाडेको छ? (Q3: Has this person stopped daily activities or household work?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. ४: के यस व्यक्तिले निराशा, बेकार वा उदासी व्यक्त गरेको छ? (Q4: Has this person expressed hopelessness, worthlessness, or sadness?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. ५: के यस व्यक्तिले सामाजिक सम्पर्क घटाएको वा घरभित्रै एक्लै बस्ने गरेको देखिन्छ? (Q5: Has social withdrawal or isolation been observed in this person?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. ६: के यस व्यक्तिले हालसालै कुनै क्षति, विपद, वा मानसिक आघात भोगेको छ? (Q6: Has this person recently experienced a loss, disaster, or trauma?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. ७: के यस व्यक्तिमा डर, भयका लक्षण, वा अचानक चम्किने प्रतिक्रिया देखिएको छ? (Q7: Has visible fear, flashbacks, or extreme startle responses been observed?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. ८: के यस व्यक्तिले आफैसँग कुरा गर्ने, अनौठो विश्वास राख्ने, वा अस्पष्ट बोली बोल्ने गरेको देखिन्छ? (Q8: Has talking to self, strange beliefs, or confused speech been observed?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. ९: के यस व्यक्तिको मदिरा वा लागु पदार्थ सेवन बढेको देखिन्छ? (Q9: Has an increase in alcohol or substance use been observed in this person?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. १०: के यस व्यक्तिले मदिरा वा लागु पदार्थका कारण परिवारको हेरचाह गर्न छाडेको देखिन्छ? (Q10: Has this person been observed neglecting their family due to substance use?) | ०        देखिएन (Not observed) १         हल्का / कहिलेकाहीं (Mild / sometimes) २        ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent) |
| प्र. ११: के यस व्यक्तिमा आत्मघाती चोट वा संकेतहरू देखिएका छन्? (Q11: Has self-harm indicators been observed?) |    	०     देखिएन (Not observed) १        हल्का / कहिलेकाहीं (Mild / sometimes) २       ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent)    कुनै पनि अंक ≥ १ भएमा तुरुन्त जोखिम (CRITICAL override) |
| प्र. १२: के यस व्यक्तिले मर्न चाहेको वा जिउन नचाहेको व्यक्त गरेको छ? (Q12: Has this person expressed a wish to die or not exist?) |    	०     देखिएन (Not observed) १        हल्का / कहिलेकाहीं (Mild / sometimes) २       ठूलो / धेरैजसो (Significant / often) ३       गम्भीर / लगातार (Severe / persistent)    कुनै पनि अंक ≥ १ भएमा तुरुन्त जोखिम (CRITICAL override) |

 

Note: Questions 11 and 12 carry mandatory override rules. Any rating of 1 or above on either question automatically triggers a CRITICAL risk level regardless of the total score, in compliance with WHO mhGAP Suicide & Self-Harm module requirements.

 

## **4.3 WHO BPRS: (Adapted Weighting)**

The differential weights assigned to Saveika's signals are informed by the Brief Psychiatric Rating Scale (BPRS),  the standard tool used in mhGAP clinical training to assess symptom severity. Self-harm and suicidality receive the highest weights (5 and 6\) consistent with mhGAP's emergency escalation protocols for these signals.

 

# **5\. The Saveika Screening Questionnaire**

The following 12-question form is designed to be completed by an FCHV during a routine monthly home visit. It takes approximately 3 minutes. All questions are observational, the FCHV rates what they directly observe about a household member, not what the person reports about themselves.

## **5.1 Response Scale**

| Value | English | Nepali |
| :---- | :---- | :---- |
| 0 | Not observed | देखिएन |
| 1 | Mild / sometimes | हल्का / कहिलेकाहीं |
| 2 | Significant / often | ठूलो / धेरैजसो |
| 3 | Severe / persistent | गम्भीर / लगातार |

 

## **5.2 Full Question Set**

| \# | Domain | Signal (English) | Signal (Nepali) | mhGAP | Weight |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Depression | Sleep changes (too much or too little) | निद्रामा परिवर्तन | DEP | 2 |
| 2 | Depression | Appetite or weight changes | खानपिनमा परिवर्तन | DEP | 2 |
| 3 | Depression | Stopped daily activities or household work | दैनिक काम बन्द गरेको | DEP | 3 |
| 4 | Depression | Expressed hopelessness, worthlessness, or sadness | निराशा वा बेकार महसुस | DEP | 4 |
| 5 | Social | Social withdrawal, staying isolated at home | सामाजिक अलगाव | DEP/PSY | 3 |
| 6 | Trauma | Experienced recent loss, disaster, or trauma | हालैको क्षति वा आघात | PTSD | 3 |
| 7 | Trauma | Visible fear, flashbacks, or extreme startle response | डर वा भयका लक्षण | PTSD | 3 |
| 8 | Psychosis | Talking to self, strange beliefs, confused speech | अनौठो बोली वा व्यवहार | PSY | 4 |
| 9 | Substance | Increase in alcohol or substance use | मदिरा/लागु पदार्थ सेवन बढेको | ALC | 3 |
| 10 | Substance | Neglecting family due to substance use | लागुले गर्दा परिवार बेवास्ता | ALC | 3 |
| 11 | Self-Harm | Self-harm indicators (cuts, burns, injuries) | आत्मघाती चोट वा संकेत | SUC | 5 |
| 12 | Self-Harm | Expressed wish to die or not exist | मर्न चाहेको वा जिउन नचाहेको | SUC | 6 |

 

**Mandatory Override Rule (mhGAP Compliance):**

Questions 11 and 12 trigger a CRITICAL risk level regardless of total score, if rated 1 or above. This is non-negotiable per WHO mhGAP Suicide & Self-Harm module, which requires immediate escalation for any suicidality indicator. This override is hard-coded in the scoring logic and cannot be overridden by the LLM.

 

## **5.3 Training Data Collection Strategy**

Each completed form submission is a potential training record. To build a labeled dataset for future ML model training:

•        Primary data: 12 question scores (0–3 each).

•        Minimum viable dataset: 500–1,000 labeled records for logistic regression; 2,000+ for gradient boosting (I don’t know which we will use).

Even without a trained ML model, Saveika's weighted heuristic score produces a defensible baseline, because it uses the same WHO mhGAP expert weights used to train human supervisors.

 

# **6\. Risk Scoring Model (0 to 100\)**

## **6.1 Architecture Overview**

Saveika's scoring pipeline has three layers. The first two are deterministic and always run. The third (LLM) adds interpretability on top of the score.

 

| Layer | Component | What It Does |
| :---- | :---- | :---- |
| 1 | Weighted Heuristic | Computes raw weighted sum from 12 signals, normalizes to 0–100 |
| 2 | Override Rules | Hard-codes CRITICAL for any suicidality; HIGH for severe psychosis |
| 3 | LLM Interpretation | Generates plain-language explanation in English \+ Nepali (Gemini {probably}  / MiniMax fallback) |

 

## **6.2 Step 1: (Weighted Raw Score)**

Each question response (0–3) is multiplied by its clinical weight. The weights are derived from mhGAP signal prioritization, self-harm carries the highest weight (6) because it has the most immediate clinical consequence.

 

| Q | Signal | Weight | Max (w×3) | Clinical Rationale |
| :---- | :---- | :---- | :---- | :---- |
| Q1 | Sleep changes | 2 | 6 | Somatic indicator, lower specificity |
| Q2 | Appetite changes | 2 | 6 | Somatic indicator, lower specificity |
| Q3 | Stopped daily activities | 3 | 9 | Functional impairment, key depression marker |
| Q4 | Hopelessness / worthlessness | 4 | 12 | Core cognitive symptom of depression (mhGAP DEP) |
| Q5 | Social withdrawal | 3 | 9 | Cross-disorder signal (DEP \+ PSY) |
| Q6 | Recent trauma or loss | 3 | 9 | PTSD precipitant |
| Q7 | Fear / flashbacks | 3 | 9 | PTSD symptom cluster |
| Q8 | Psychosis signs | 4 | 12 | High clinical risk, requires specialist attention |
| Q9 | Substance use increase | 3 | 9 | Alcohol module risk factor |
| Q10 | Family neglect due to substance | 3 | 9 | Severity escalator for substance disorder |
| Q11 | Self-harm indicators | 5 | 15 | Immediate safety concern (mhGAP override) |
| Q12 | Wish to die | 6 | 18 | Highest risk, immediate escalation required |

 

Maximum Raw Score: 123 (all signals rated 3\)

Normalization Formula: score \= round (raw\_sum / 123 × 100\)

 

## **6.3 Step 2: (Hard Override Rules)**

| Condition | Override | mhGAP Basis |
| :---- | :---- | :---- |
| Q11 ≥ 1 OR Q12 ≥ 1 | CRITICAL (min) | mhGAP Suicide & Self-Harm Module (immediate escalation) |
| Q8 \= 3 | HIGH (min) | mhGAP Psychosis Module (requires health post referral) |
| Q12 \= 3 | CRITICAL (min) | Active suicidal ideation (most urgent mhGAP flag) |

 

## **6.4 Step 3: (Risk Bands)**

| Score | Risk Level | Label | Required Action |
| :---- | :---- | :---- | :---- |
| 0 – 25 | Low | कम जोखिम (Kam Jokhim) | Log and monitor. Continue routine monthly visits. |
| 26 – 50 | Moderate | मध्यम जोखिम (Madhyam Jokhim) | Return visit within 1 week. Inform supervisor. |
| 51 – 75 | High | उच्च जोखिम (Uccha Jokhim) | Refer to the health post. Flag in dashboard. Supervisor review required. |
| 76 – 100 | Critical | गम्भीर जोखिम (Gambhir Jokhim) | Immediate escalation. Contact supervisor \+ doctor. Emergency protocol. |

 

 

 

 

 

## **6.5 Step 4: (LLM Interpretation Layer)**

The LLM does not calculate the score. The score is always computed deterministically by the weighted heuristic. The LLM's role is interpretability only, it receives the finalized score and signal values, and returns a plain-language explanation in both English and Nepali.

## **6.6 Future ML Model Path**

Once 500–1,000 labeled records exist (form responses or created by us), the weighted heuristic can be replaced or augmented with a trained model:

•        Input: 12 question scores (0–3 each), optionally augmented with area, season, visit history

•        Output: Probability distribution across 4 risk classes (low / moderate / high / critical)

•        Recommended architecture: Logistic regression (I am thinking about this) or LightGBM

•        Minimum data for logistic regression: \~500 records

•        Both approaches produce a probability that maps directly to the 0–100 score (probability of critical × 100\)

 

 

**Why the Weighted Heuristic Is Enough for us:**

The weights are derived from WHO mhGAP expert guidelines, the same guidelines used to train Nepal's Ministry of Health supervisors. The LLM adds plain-language explanations that make the score actionable for FCHVs.
