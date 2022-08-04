CREATE TABLE `employee` (
  `matr` varchar(50) NOT NULL,
  `first_name` varchar(20) DEFAULT NULL,
  `last_name` varchar(20) DEFAULT NULL,
  `email` varchar(40) DEFAULT NULL,
  `password` varchar(200) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT NULL,
  `phone` varchar(10) DEFAULT NULL,
  `responsability` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`matr`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone_unique` (`phone`)
);

CREATE TABLE `meet` (
  `code` varchar(50) NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `description` varchar(300) DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `meet_owner` varchar(50) DEFAULT NULL,
  `owner_part_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`code`),
  UNIQUE KEY `owner_part_code` (`owner_part_code`),
  KEY `meet_emp_fk` (`meet_owner`),
  CONSTRAINT `meet_emp_fk` FOREIGN KEY (`meet_owner`) REFERENCES `employee` (`matr`) ON DELETE CASCADE
);

CREATE TABLE `participant` (
  `meet_code` varchar(50) NOT NULL,
  `emp_matr` varchar(50) NOT NULL,
  `part_code` varchar(50) NOT NULL,
  PRIMARY KEY (`part_code`),
  UNIQUE KEY `meet_code` (`meet_code`,`emp_matr`),
  KEY `participant_ibfk_2` (`emp_matr`),
  CONSTRAINT `participant_ibfk_1` FOREIGN KEY (`meet_code`) REFERENCES `meet` (`code`) ON DELETE CASCADE,
  CONSTRAINT `participant_ibfk_2` FOREIGN KEY (`emp_matr`) REFERENCES `employee` (`matr`) ON DELETE CASCADE
);
