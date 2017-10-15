# Acorn API (typescript)
This project is inspired by [AcornAPI](https://github.com/LesterLyu/AcornAPI)
 which is an Acorn API written in Java.

## Installation
```bash
npm install acorn-api --save
```

## Example

### Login
```javascript
import { Acorn } from 'acorn-api-js';
const example = new Acorn();
example.basic.login('user', 'pass');
```

### Get Registrations
```javascript
example.course.getEligibleRegistrations();
```

### Get Student Courses
```javascript
example.course.getEnrolledCourses();
example.course.getCartedCourses();
```

### Get Course Info (Can also use it to get waiting list rank for a waitlisted course)
```javascript
int registrationIndex = 0;
const courseCode = "CSC373H1", sectionCode = "Y", courseSessionCode = "20175";
const course = example.getExtraCourseInfo(registrationIndex, courseCode, courseSessionCode, sectionCode);
```

### Enroll a Course (Not yet tested)
```javascript
int registrationIndex = 0;
const courseCode = "CSC373H1", sectionCode = "Y", lecSection = "LEC,5101";
const result = example.course.enroll(registrationIndex, courseCode, sectionCode, lecSection);
```

### Get Current Transcript
```javascript
const academicReport = example.academic.getAcademicHistory();
```

