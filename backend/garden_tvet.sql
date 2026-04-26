-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 25, 2026 at 04:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `garden_tvet`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `trade` varchar(100) NOT NULL,
  `level` varchar(50) NOT NULL,
  `previous_school` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `review_notes` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late','excused') NOT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auto_reminder_settings`
--

CREATE TABLE `auto_reminder_settings` (
  `id` int(11) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 0,
  `reminder_type` enum('daily','weekly','monthly','custom') DEFAULT 'weekly',
  `schedule_day` varchar(10) DEFAULT NULL,
  `schedule_time` time NOT NULL DEFAULT '08:00:00',
  `min_balance_threshold` decimal(12,2) DEFAULT 0.00,
  `exclude_paid_students` tinyint(1) DEFAULT 1,
  `message_template` text DEFAULT NULL,
  `include_balance_details` tinyint(1) DEFAULT 1,
  `include_student_info` tinyint(1) DEFAULT 1,
  `send_to_primary_parent` tinyint(1) DEFAULT 1,
  `send_to_all_parents` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_run_at` timestamp NULL DEFAULT NULL,
  `next_run_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auto_reminder_settings`
--

INSERT INTO `auto_reminder_settings` (`id`, `is_enabled`, `reminder_type`, `schedule_day`, `schedule_time`, `min_balance_threshold`, `exclude_paid_students`, `message_template`, `include_balance_details`, `include_student_info`, `send_to_primary_parent`, `send_to_all_parents`, `created_by`, `created_at`, `updated_at`, `last_run_at`, `next_run_at`) VALUES
(1, 0, 'weekly', 'monday', '08:00:00', 1000.00, 1, 'Muraho mwiriwe, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!', 1, 1, 1, 0, 1, '2026-03-15 06:21:16', '2026-03-15 06:21:16', NULL, NULL),
(2, 0, 'weekly', 'monday', '08:00:00', 1000.00, 1, 'Muraho mwiriwe, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!', 1, 1, 1, 0, 1, '2026-03-16 09:32:16', '2026-03-16 09:32:16', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cms_pages`
--

CREATE TABLE `cms_pages` (
  `id` int(11) NOT NULL,
  `page_key` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text DEFAULT NULL,
  `meta_description` varchar(300) DEFAULT NULL,
  `hero_image` varchar(255) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `content_blocks`
--

CREATE TABLE `content_blocks` (
  `id` int(11) NOT NULL,
  `section_name` varchar(100) NOT NULL,
  `content_rw` text DEFAULT NULL,
  `content_en` text DEFAULT NULL,
  `content_fr` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `content_blocks`
--

INSERT INTO `content_blocks` (`id`, `section_name`, `content_rw`, `content_en`, `content_fr`, `image_url`, `updated_at`) VALUES
(1, 'home_hero', 'Ikaze mu Ishuri rya Garden TVET. Twubaka ejo hazaza heza!', 'Welcome to Garden TVET School. Building a better future!', 'Bienvenue à l école Garden TVET. Construire un avenir meilleur!', NULL, '2026-03-15 06:20:04'),
(2, 'about_us', 'Garden TVET ni ishuri ry ubumenyingiro ritanga uburezi bwiza...', 'Garden TVET is a vocational school providing quality education...', 'Garden TVET est une école professionnelle offrant une éducation de qualité...', NULL, '2026-03-15 06:20:04');

-- --------------------------------------------------------

--
-- Table structure for table `cron_jobs`
--

CREATE TABLE `cron_jobs` (
  `id` int(11) NOT NULL,
  `job_name` varchar(100) NOT NULL,
  `job_type` enum('sms_reminder','backup','cleanup','report','sync') NOT NULL,
  `schedule_type` enum('daily','weekly','monthly','custom') DEFAULT 'daily',
  `schedule_time` time DEFAULT NULL,
  `schedule_day` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_run` timestamp NULL DEFAULT NULL,
  `next_run` timestamp NULL DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `status` enum('idle','running','completed','failed') DEFAULT 'idle',
  `last_error` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cron_jobs`
--

INSERT INTO `cron_jobs` (`id`, `job_name`, `job_type`, `schedule_type`, `schedule_time`, `schedule_day`, `is_active`, `last_run`, `next_run`, `config`, `status`, `last_error`, `created_at`) VALUES
(1, 'daily_payment_reminder', 'sms_reminder', 'daily', '08:00:00', NULL, 1, NULL, NULL, '{\"time\": \"08:00\", \"enabled_days\": [1,2,3,4,5], \"message_template\": \"Dear parent, this is a reminder that fees payment for {{student_name}} is due. Amount: {{amount}} RWF. Please pay to avoid interruption.\"}', 'idle', NULL, '2026-03-16 09:32:10'),
(2, 'weekly_overdue_check', 'sms_reminder', 'weekly', '09:00:00', NULL, 1, NULL, NULL, '{\"day\": \"monday\", \"time\": \"09:00\", \"overdue_days\": 7, \"message_template\": \"Dear parent, fees payment for {{student_name}} is overdue by {{days}} days. Please pay {{amount}} RWF to avoid further action.\"}', 'idle', NULL, '2026-03-16 09:32:10'),
(3, 'monthly_report', 'report', 'monthly', '10:00:00', NULL, 1, NULL, NULL, '{\"day\": 1, \"time\": \"10:00\", \"report_types\": [\"payment\", \"enrollment\", \"discipline\"]}', 'idle', NULL, '2026-03-16 09:32:10');

-- --------------------------------------------------------

--
-- Table structure for table `discipline_appeals`
--

CREATE TABLE `discipline_appeals` (
  `id` int(11) NOT NULL,
  `discipline_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `appeal_reason` text NOT NULL,
  `evidence_files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence_files`)),
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `decided_by` int(11) DEFAULT NULL,
  `decided_at` timestamp NULL DEFAULT NULL,
  `decision_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discipline_records`
--

CREATE TABLE `discipline_records` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `action_type` enum('sick','leave','punish','conduct_removal') NOT NULL,
  `description` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `severity` enum('low','medium','high','critical') DEFAULT 'low',
  `incident_date` date DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `witness_names` text DEFAULT NULL,
  `evidence_files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence_files`)),
  `follow_up_required` tinyint(1) DEFAULT 0,
  `follow_up_date` date DEFAULT NULL,
  `removal_reason` text DEFAULT NULL,
  `points_deducted` int(11) DEFAULT 0,
  `status` enum('active','resolved','appealed','closed') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_assessments`
--

CREATE TABLE `driving_assessments` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `title_kinya` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `description_kinya` text DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `questions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`questions`)),
  `duration_minutes` int(11) DEFAULT NULL,
  `passing_score` int(11) DEFAULT 70,
  `instructor_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_courses`
--

CREATE TABLE `driving_courses` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `title_kinya` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `description_kinya` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `duration_hours` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `order_num` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_enrollments`
--

CREATE TABLE `driving_enrollments` (
  `id` int(11) NOT NULL,
  `learner_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `progress_percent` int(11) DEFAULT 0,
  `completed_lessons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`completed_lessons`)),
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_instructors`
--

CREATE TABLE `driving_instructors` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `national_id` varchar(20) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_learners`
--

CREATE TABLE `driving_learners` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `national_id` varchar(20) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `assigned_instructor_id` int(11) DEFAULT NULL,
  `enrolled_courses` text DEFAULT NULL,
  `progress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`progress`)),
  `status` enum('pending','active','completed','suspended') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_lessons`
--

CREATE TABLE `driving_lessons` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `title_kinya` varchar(200) NOT NULL,
  `content` text DEFAULT NULL,
  `content_kinya` text DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `order_num` int(11) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_materials`
--

CREATE TABLE `driving_materials` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `title_kinya` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `description_kinya` text DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_payments`
--

CREATE TABLE `driving_payments` (
  `id` int(11) NOT NULL,
  `national_id` varchar(20) NOT NULL,
  `sender_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_code` varchar(20) NOT NULL,
  `status` enum('pending','verified','rejected') DEFAULT 'pending',
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_quiz_questions`
--

CREATE TABLE `driving_quiz_questions` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `question` text NOT NULL,
  `question_kinya` text NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`options`)),
  `correct_answer` int(11) NOT NULL,
  `explanation` text DEFAULT NULL,
  `explanation_kinya` text DEFAULT NULL,
  `points` int(11) DEFAULT 1,
  `order_num` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `driving_quiz_questions`
--

INSERT INTO `driving_quiz_questions` (`id`, `course_id`, `question`, `question_kinya`, `options`, `correct_answer`, `explanation`, `explanation_kinya`, `points`, `order_num`, `is_active`) VALUES
(4, NULL, 'Ikinyabiziga cyose cyangwa ibinyabiziga bigenda bigomba kugira:', 'Ikinyabiziga cyose cyangwa ibinyabiziga bigenda bigomba kugira:', '[\"Umuyobozi\",\"Umuherekeza\",\"A na B ni ibisubizo by ukuri\",\"Nta gisubizo cy ukuri kirimo\"]', 2, 'Ikinyabiziga kigomba kugira umuyobozi n umuherekeza', 'Ikinyabiziga kigomba kugira umuyobozi n umuherekeza', 1, 1, 1),
(5, NULL, 'Ijambo \"akayira\" bivuga inzira nyabagendwa ifunganye yagenewe gusa:', 'Ijambo \"akayira\" bivuga inzira nyabagendwa ifunganye yagenewe gusa:', '[\"Abanyamaguru\",\"Ibinyabiziga bigendera ku biziga bibiri\",\"A na B ni ibisubizo by ukuri\",\"Nta gisubizo cy ukuri kirimo\"]', 2, 'Akayira ni inzira yagenewe abanyamaguru n ibinyabiziga bibiri', 'Akayira ni inzira yagenewe abanyamaguru n ibinyabiziga bibiri', 1, 2, 1),
(6, NULL, 'Umurongo uciyemo uduce umenyesha ahegereye umurongo ushobora kuzuzwa n uturanga gukata tw ibara ryera utwo turanga cyerekezo tumenyesha:', 'Umurongo uciyemo uduce umenyesha ahegereye umurongo ushobora kuzuzwa n uturanga gukata tw ibara ryera utwo turanga cyerekezo tumenyesha:', '[\"Igisate cy umuhanda abayobozi bagomba gukurikira\",\"Ahegereye umurongo ukomeje\",\"Igabanurwa ry umubarew ibisate by umuhanda mu cyerekezo bajyamo\",\"A na C nibyo\"]', 3, 'Iryo ruhuro rugabanya ibisate', 'Iryo ruhuro rugabanya ibisate', 1, 3, 1),
(7, NULL, 'Ahantu ho kugendera mu muhanda herekanwa n ibimenyetso bimurika ibinyabiziga ntibishobora kuhagenda:', 'Ahantu ho kugendera mu muhanda herekanwa n ibimenyetso bimurika ibinyabiziga ntibishobora kuhagenda:', '[\"Biteganye\",\"Ku murongo umwe\",\"A na B nibyo\",\"Nta gisubizo cy ukuri kirimo\"]', 3, 'Ibyo bitari ibisubizo by ukuri', 'Ibyo bitari ibisubizo by ukuri', 1, 4, 1),
(8, NULL, 'Ibinyabiziga bikurikira bigomba gukorerwa isuzumwa buri mwaka:', 'Ibinyabiziga bikurikira bigomba gukorerwa isuzumwa buri mwaka:', '[\"Ibinyabiziga bigenewe gutwara abagenzi mu rusange\",\"Ibinyabiziga bigenewe gutwara ibintu birengeje toni 3.5\",\"Ibinyabiziga bigenewe kwigisha gutwara\",\"Nta gisubizo cy ukuri kirimo\"]', 3, 'Ibinyabiziga byose bigomba isuzumwa', 'Ibinyabiziga byose bigomba isuzumwa', 1, 5, 1),
(9, NULL, 'Ubugari bwa romoruki ikuruwe n ikinyamitende itatu ntibugomba kurenza ibipimo bikurikira:', 'Ubugari bwa romoruki ikuruwe n ikinyamitende itatu ntibugomba kurenza ibipimo bikurikira:', '[\"cm75\",\"cm125\",\"cm265\",\"Nta gisubizo cy ukuri\"]', 2, 'Ubugari bwa romoruki ntibugomba kurenza 265cm', 'Ubugari bwa romoruki ntibugomba kurenza 265cm', 1, 6, 1),
(10, NULL, 'Uburebure bw ibinyabiziga bikurikira ntibugomba kurenga metero 11:', 'Uburebure bw ibinyabiziga bikurikira ntibugomba kurenga metero 11:', '[\"Ibifite umutambiko umwe uhuza imipira\",\"Ibifite imitambiko ibiri ikurikiranye mu bugari bwayo\",\"Makuzungu\",\"Nta gisubizo cy ukuri\"]', 3, 'Ntabwo iri gisubizo', 'Ntabwo iri gisubizo', 1, 7, 1),
(11, NULL, 'Ikinyabiziga kibujijwe guhagarara akanya kanini aha hakurikira:', 'Ikinyabiziga kibujijwe guhagarara akanya kanini aha hakurikira:', '[\"Ahatarengeje metro 1 imbere cyangwa inyuma y ikinyabiziga gihagaze\",\"Ahantu hari ibimenyetso bibuza byabugenewe\",\"Aho abanyamaguru banyura mu muhanda ngo bakikire inkomyi\",\"Ibisubizo byose nibyo\"]', 3, 'Byose ni ibibujijwe', 'Byose ni ibibujijwe', 1, 8, 1),
(12, NULL, 'Kunyuranaho bikorerwa:', 'Kunyuranaho bikorerwa:', '[\"Mu ruhande rw iburyo gusa\",\"Igihe cyose ni ibumoso\",\"Iburyo iyo unyura ku nyamaswa\",\"Nta gisubizo cy ukuri kirimo\"]', 2, 'Kunyuranaho bikorerwa iburyo iyo unyura ku nyamaswa', 'Kunyuranaho bikorerwa iburyo iyo unyura ku nyamaswa', 1, 9, 1),
(13, NULL, 'Icyapa cyerekana umuvuduko ntarengwa ikinyabiziga kitagomba kurenza gishyirwa gusa ku binyabiziga bifite uburemere ntarengwa bukurikira:', 'Icyapa cyerekana umuvuduko ntarengwa ikinyabiziga kitagomba kurenza gishyirwa gusa ku binyabiziga bifite uburemere ntarengwa bukurikira:', '[\"Burenga toni 1\",\"Burenga toni 2\",\"Burenga toni 24\",\"Nta gisubizo cy ukuri kirimo\"]', 2, 'Ku binyabiziga burenga toni 2', 'Ku binyabiziga burenga toni 2', 1, 10, 1),
(14, NULL, 'Ahatari mu nsisiro umuvuduko ntarengwa mu isaha wa velomoteri ni:', 'Ahatari mu nsisiro umuvuduko ntarengwa mu isaha wa velomoteri ni:', '[\"Km50\",\"Km40\",\"Km30\",\"Nta gisubizo cy ukuri\"]', 2, 'Umuvuduko ni Km30 mu nsisiro', 'Umuvuduko ni Km30 mu nsisiro', 1, 11, 1),
(15, NULL, 'Umuyobozi ugenda mu muhanda igihe ubugari bwawo budatuma anyuranaho nta nkomyi ashobora kunyura mu kayira k abanyamaguru ariko amaze kureba ibi bikurikira:', 'Umuyobozi ugenda mu muhanda igihe ubugari bwawo budatuma anyuranaho nta nkomyi ashobora kunyura mu kayira k abanyamaguru ariko amaze kureba ibi bikurikira:', '[\"Umuvuduko w abanyamaguru\",\"Ubugari bw umuhanda\",\"Umubare w abanyamaguru\",\"Nta gisubizo cy ukuri kirimo\"]', 2, 'Ugira icyo areba kugira ngo anyuranaho', 'Ugira icyo areba kugira ngo anyuranaho', 1, 12, 1),
(16, NULL, 'Ku byerekeye kwerekana ibinyabiziga n ukumurika kwabyo ndetse no kwerekana ihindura ry ibyerekezo byabyo. Birabujijwe gukora andi matara cyangwa utugarurarumuri uretse ibitegetswe ariko ntibireba amatara akurikira:', 'Ku byerekeye kwerekana ibinyabiziga n ukumurika kwabyo ndetse no kwerekana ihindura ry ibyerekezo byabyo. Birabujijwe gukora andi matara cyangwa utugarurarumuri uretse ibitegetswe ariko ntibireba amatara akurikira:', '[\"Amatara ndanga\",\"Amatara ari imbere mu modoka\",\"Amatara ndangaburumbarare\",\"Ibisubizo byose nibyo\"]', 3, 'Birabujijwe gukora andi matara', 'Birabujijwe gukora andi matara', 1, 13, 1),
(17, NULL, 'Iyo nta mategeko awugabanya by umwihariko umuvuduko ntarengwa w amapikipiki mu isaha ni:', 'Iyo nta mategeko awugabanya by umwihariko umuvuduko ntarengwa w amapikipiki mu isaha ni:', '[\"Km25\",\"Km70\",\"Km40\",\"Nta gisubizo cy ukuri kirimo\"]', 0, 'Umuvuduko w amapikipiki ni Km25', 'Umuvuduko w amapikipiki ni Km25', 1, 14, 1),
(18, NULL, 'Uburyo bukoreshwa kugirango ikinyabiziga kigende gahoro igihe feri idakora neza babwita:', 'Uburyo bukoreshwa kugirango ikinyabiziga kigende gahoro igihe feri idakora neza babwita:', '[\"Feri y urugendo\",\"Feri yo guhagarara umwanya munini\",\"Feri yo gutabara\",\"Nta gisubizo cy ukuri kirimo\"]', 1, 'Feri yo guhagarara igenda neza', 'Feri yo guhagarara igenda neza', 1, 15, 1),
(19, NULL, 'Nibura ikinyabiziga gitegetswe kugira uduhanagurakirahure tungahe:', 'Nibura ikinyabiziga gitegetswe kugira uduhanagurakirahure tungahe:', '[\"2\",\"3\",\"1\",\"Nta gisubizo cy ukuri kirimo\"]', 0, 'Ikinyabiziga kigomba kugira uduhanagurakirahure 2', 'Ikinyabiziga kigomba kugira uduhanagurakirahure 2', 1, 16, 1),
(20, NULL, 'Amatara maremare y ikinyabiziga agomba kuzimwa mu bihe bikurikira:', 'Amatara maremare y ikinyabiziga agomba kuzimwa mu bihe bikurikira:', '[\"Iyo umuhanda umurikiye umuyobozi abusha kureba muri metero 20\",\"Iyo ikinyabiziga kigiye kubisikana n ibindi\",\"Iyo ari mu nsisiro\",\"Ibisubizo byose ni ukuri\"]', 3, 'Amatara maremare agomba kuzimwa mu byose', 'Amatara maremare agomba kuzimwa mu byose', 1, 17, 1),
(21, NULL, 'Ikinyabiziga ntigishobora kugira amatara arenga abiri y ubwoko bumwe keretse kubyerekeye amatara akurikira:', 'Ikinyabiziga ntigishobora kugira amatara arenga abiri y ubwoko bumwe keretse kubyerekeye amatara akurikira:', '[\"Itara ndangamubyimba\",\"Itara ryerekana icyerekezo\",\"Itara ndangaburumbarare\",\"Ibisubizo byose ni ukuri\"]', 3, 'Ntabwo igira amatara arenga abiri', 'Ntabwo igira amatara arenga abiri', 1, 18, 1),
(22, NULL, 'Ubugari bwa romoruki ikuruwe n igare cyangwa velomoteri ntiburenza ibipimo bikurikira:', 'Ubugari bwa romoruki ikuruwe n igare cyangwa velomoteri ntiburenza ibipimo bikurikira:', '[\"cm25\",\"cm125\",\"cm45\",\"Nta gisubizo cy ukuri kirimo\"]', 2, 'Uburebure ntiburenza 45cm', 'Uburebure ntiburenza 45cm', 1, 19, 1),
(23, NULL, 'Ibinyabiziga bikoreshwa nka tagisi bitegerereza abantu mu nzira nyabagendwa bishobora gushyirwaho itara ryerekana ko ikinyabiziga kitakodeshejwe. Iryo tara rishyirwaho ku buryo bukurikira:', 'Ibinyabiziga bikoreshwa nka tagisi bitegerereza abantu mu nzira nyabagendwa bishobora gushyirwaho itara ryerekana ko ikinyabiziga kitakodeshejwe. Iryo tara rishyirwaho ku buryo bukurikira:', '[\"Ni itara ry icyatsi rishyirwa imbere ku kinyabiziga\",\"Ni itara ry icyatsi rishyirwa ibumoso\",\"Ni itara ry umuhondo rishyirwa inyuma\",\"A na C ni ibisubizo by ukuri\"]', 3, 'Iryo tara rishyirwa imbere cyangwa inyuma', 'Iryo tara rishyirwa imbere cyangwa inyuma', 1, 20, 1);

-- --------------------------------------------------------

--
-- Table structure for table `driving_quiz_results`
--

CREATE TABLE `driving_quiz_results` (
  `id` int(11) NOT NULL,
  `learner_id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `score` int(11) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `passed` tinyint(1) DEFAULT 0,
  `taken_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_road_signs`
--

CREATE TABLE `driving_road_signs` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_rules_users`
--

CREATE TABLE `driving_rules_users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `national_id` varchar(20) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `quiz_score` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driving_stock`
--

CREATE TABLE `driving_stock` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `name_kinya` varchar(200) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `price` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_results`
--

CREATE TABLE `exam_results` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `exam_type` enum('midterm','final','quiz','assignment') NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `max_score` decimal(5,2) DEFAULT 100.00,
  `term` varchar(50) DEFAULT NULL,
  `year` year(4) DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fees`
--

CREATE TABLE `fees` (
  `id` int(11) NOT NULL,
  `term` varchar(50) NOT NULL,
  `trade` varchar(100) NOT NULL,
  `level` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `student_category` enum('public','private','both') DEFAULT 'both',
  `description` text DEFAULT NULL,
  `due_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fees`
--

INSERT INTO `fees` (`id`, `term`, `trade`, `level`, `amount`, `created_at`, `is_active`, `created_by`, `student_category`, `description`, `due_date`) VALUES
(1, 'Term 1 2026', 'Software Development', 'Level 3', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(2, 'Term 1 2026', 'Software Development', 'Level 4', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(3, 'Term 1 2026', 'Software Development', 'Level 5', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(4, 'Term 1 2026', 'Automobile Technology', 'Level 3', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(5, 'Term 1 2026', 'Automobile Technology', 'Level 4A', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(6, 'Term 1 2026', 'Automobile Technology', 'Level 4B', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(7, 'Term 1 2026', 'Automobile Technology', 'Level 5A', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(8, 'Term 1 2026', 'Automobile Technology', 'Level 5B', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(9, 'Term 1 2026', 'Building & Construction', 'Level 3', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(10, 'Term 1 2026', 'Building & Construction', 'Level 4', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(11, 'Term 1 2026', 'Building & Construction', 'Level 5', 150000.00, '2026-03-17 06:20:50', 1, NULL, 'both', NULL, NULL),
(12, 'Term 1 2026', 'Software Development', 'Level 4', 97000.00, '2026-03-25 13:48:21', 1, 4, 'private', 'bbbb', '2000-12-06');

-- --------------------------------------------------------

--
-- Table structure for table `fee_structures`
--

CREATE TABLE `fee_structures` (
  `id` int(11) NOT NULL,
  `term` varchar(50) DEFAULT NULL,
  `trade` varchar(100) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_dynamic_columns`
--

CREATE TABLE `finance_dynamic_columns` (
  `id` int(11) NOT NULL,
  `column_key` varchar(50) NOT NULL,
  `column_name` varchar(100) NOT NULL,
  `data_type` enum('text','number','date','select','checkbox','textarea') DEFAULT 'text',
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `category` enum('fee','expense','payment','report') DEFAULT 'fee',
  `is_required` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `finance_dynamic_columns`
--

INSERT INTO `finance_dynamic_columns` (`id`, `column_key`, `column_name`, `data_type`, `options`, `category`, `is_required`, `display_order`, `is_active`, `created_at`) VALUES
(1, 'payment_method', 'Payment Method', 'select', NULL, 'payment', 1, 1, 1, '2026-03-16 09:32:10'),
(2, 'transaction_ref', 'Transaction Reference', 'text', NULL, 'payment', 1, 2, 1, '2026-03-16 09:32:10'),
(3, 'receipt_number', 'Receipt Number', 'text', NULL, 'payment', 0, 3, 1, '2026-03-16 09:32:10'),
(4, 'expense_category', 'Expense Category', 'select', NULL, 'expense', 1, 1, 1, '2026-03-16 09:32:10'),
(5, 'vendor_name', 'Vendor Name', 'text', NULL, 'expense', 1, 2, 1, '2026-03-16 09:32:10'),
(6, 'invoice_number', 'Invoice Number', 'text', NULL, 'expense', 0, 3, 1, '2026-03-16 09:32:10');

-- --------------------------------------------------------

--
-- Table structure for table `grade_archives`
--

CREATE TABLE `grade_archives` (
  `id` int(11) NOT NULL,
  `original_grade_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `term` varchar(50) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `grade_type` varchar(50) NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `max_score` decimal(5,2) NOT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `grade_letter` varchar(2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_reason` text DEFAULT NULL,
  `deleted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `archived_from` varchar(50) DEFAULT 'delete'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hero_slides`
--

CREATE TABLE `hero_slides` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `subtitle` text DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_link` varchar(200) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hero_slides`
--

INSERT INTO `hero_slides` (`id`, `title`, `subtitle`, `image_url`, `button_text`, `button_link`, `order_index`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Shape Your Future', 'Hands-on skills and expert knowledge', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0013.jpg', 'Apply Now', '/apply', 1, 1, '2026-03-15 06:21:23', '2026-03-15 06:21:23'),
(2, 'Learn from Experts', 'Industry professionals with years of experience', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0015.jpg', 'Learn More', '/about', 2, 1, '2026-03-15 06:21:23', '2026-03-16 09:32:17'),
(3, 'Build Your Career', 'Practical skills that employers need', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0017.jpg', 'View Programs', '/services', 3, 1, '2026-03-15 06:21:23', '2026-03-16 09:32:17'),
(4, 'Shape Your Future', 'Hands-on skills and expert knowledge', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0013.jpg', 'Apply Now', '/apply', 1, 1, '2026-03-16 09:32:18', '2026-03-16 09:32:18'),
(5, 'Learn from Experts', 'Our teachers are industry professionals with years of experience', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0015.jpg', 'Learn More', '/about', 2, 1, '2026-03-16 09:32:18', '2026-03-16 09:32:18'),
(6, 'Build Your Career', 'Get practical skills that employers are looking for', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0017.jpg', 'View Programs', '/services', 3, 1, '2026-03-16 09:32:18', '2026-03-16 09:32:18');

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `leave_type` enum('sick','personal','emergency','bereavement','academic','other') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int(11) NOT NULL,
  `reason` text NOT NULL,
  `supporting_document` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` int(11) NOT NULL,
  `title_rw` varchar(255) NOT NULL,
  `title_en` varchar(255) DEFAULT NULL,
  `title_fr` varchar(255) DEFAULT NULL,
  `content_rw` text NOT NULL,
  `content_en` text DEFAULT NULL,
  `content_fr` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 1,
  `author_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `featured_image` varchar(255) DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `view_count` int(11) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `category` varchar(50) DEFAULT 'announcement',
  `summary` text DEFAULT NULL,
  `views_count` int(11) DEFAULT 0,
  `likes_count` int(11) DEFAULT 0,
  `shares_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `news_comments`
--

CREATE TABLE `news_comments` (
  `id` int(11) NOT NULL,
  `news_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `guest_name` varchar(100) DEFAULT NULL,
  `guest_email` varchar(100) DEFAULT NULL,
  `comment` text NOT NULL,
  `parent_comment_id` int(11) DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `news_engagement`
--

CREATE TABLE `news_engagement` (
  `id` int(11) NOT NULL,
  `news_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `guest_session_id` varchar(100) DEFAULT NULL,
  `engagement_type` enum('view','like','share') NOT NULL,
  `platform` enum('website','facebook','twitter','whatsapp','email') DEFAULT 'website',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `news_images`
--

CREATE TABLE `news_images` (
  `id` int(11) NOT NULL,
  `news_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `type` enum('info','success','warning','error','sms','payment','grade','discipline','application') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `priority` enum('low','normal','urgent') DEFAULT 'normal',
  `notification_type` varchar(50) DEFAULT 'general'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parent_link_requests`
--

CREATE TABLE `parent_link_requests` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `student_name` varchar(200) NOT NULL,
  `student_trade` varchar(100) DEFAULT NULL,
  `student_level` varchar(50) DEFAULT NULL,
  `student_gender` enum('Male','Female') DEFAULT NULL,
  `status` enum('pending','linked','rejected') DEFAULT 'pending',
  `linked_student_id` int(11) DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parent_link_requests`
--

INSERT INTO `parent_link_requests` (`id`, `parent_id`, `student_name`, `student_trade`, `student_level`, `student_gender`, `status`, `linked_student_id`, `requested_at`, `created_at`) VALUES
(1, 5, 'reponse kdz', 'Software Development', 'Level 3', 'Female', 'pending', NULL, '2026-03-16 11:13:51', '2026-03-23 13:00:50'),
(2, 13, 'niyonkuru  reponse', 'Software Development', 'Level 4', 'Male', 'pending', NULL, '2026-03-18 16:11:32', '2026-03-23 13:00:50'),
(3, 15, 'reponse nyonkuru', 'Software Development', 'Level 4', 'Male', 'pending', NULL, '2026-03-25 14:09:11', '2026-03-25 14:09:11');

-- --------------------------------------------------------

--
-- Table structure for table `parent_notifications`
--

CREATE TABLE `parent_notifications` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `notification_type` enum('sms','payment_reminder','discipline','application','general','system') DEFAULT 'general',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parent_notifications`
--

INSERT INTO `parent_notifications` (`id`, `parent_id`, `title`, `message`, `notification_type`, `is_read`, `created_at`) VALUES
(1, 5, 'Murakaza neza', 'Konti yawe yashyizweho neza!', 'system', 0, '2026-03-16 11:19:22'),
(2, 5, 'Kwishyura', 'Wishyura amashinga ya school.', '', 0, '2026-03-16 11:19:22');

-- --------------------------------------------------------

--
-- Table structure for table `parent_student_links`
--

CREATE TABLE `parent_student_links` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `relationship` enum('father','mother','guardian','other') DEFAULT 'father',
  `is_primary` tinyint(1) DEFAULT 1,
  `sms_enabled` tinyint(1) DEFAULT 1,
  `notification_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_preferences`)),
  `linked_by` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected','suspended') DEFAULT 'pending',
  `link_status` varchar(20) DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `fee_id` int(11) DEFAULT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `recorded_by` int(11) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'bank_transfer',
  `transaction_ref` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT 'partial',
  `transaction_reference` varchar(100) DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `payments_with_receipts`
-- (See below for the actual view)
--
CREATE TABLE `payments_with_receipts` (
`payment_id` int(11)
,`student_id` int(11)
,`fee_id` int(11)
,`amount_paid` decimal(10,2)
,`payment_date` timestamp
,`payment_method` varchar(50)
,`transaction_ref` varchar(100)
,`notes` text
,`student_first_name` varchar(50)
,`student_last_name` varchar(50)
,`reg_number` varchar(50)
,`trade` varchar(100)
,`student_level` varchar(50)
,`receipt_image_url` varchar(255)
,`receipt_status` enum('pending','verified','rejected')
,`receipt_description` varchar(255)
,`receipt_uploaded_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `payment_receipts`
--

CREATE TABLE `payment_receipts` (
  `id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `receipt_image_url` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('pending','verified','rejected') DEFAULT 'pending',
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_reminders`
--

CREATE TABLE `payment_reminders` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `reminder_type` enum('manual','auto','bulk') NOT NULL,
  `message_content` text NOT NULL,
  `amount_due` decimal(12,2) DEFAULT NULL,
  `balance_at_time` decimal(12,2) DEFAULT NULL,
  `sms_status` enum('pending','sent','delivered','failed') DEFAULT 'pending',
  `sent_via` enum('africa_talking','manual','system') DEFAULT 'africa_talking',
  `africas_talking_id` varchar(100) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_reminder_templates`
--

CREATE TABLE `payment_reminder_templates` (
  `id` int(11) NOT NULL,
  `template_name` varchar(100) NOT NULL,
  `template_content` text NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_reminder_templates`
--

INSERT INTO `payment_reminder_templates` (`id`, `template_name`, `template_content`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Balance Reminder', 'Muraho mwiriwe, umwana {{student_name}} ({{reg_number}}) afite ikibanza ya {{balance}} RWF. Mwakwifashishamo kwishyura vuba. Murakoze!', 1, 1, '2026-03-15 06:21:16', '2026-03-15 06:21:16'),
(2, 'Partial Payment Reminder', 'Muraho, kwishyura kwa {{student_name}} ntago ruzuzwa. Ikibanze ni {{balance}} RWF. Mwakubashishaka. Murakoze!', 1, 1, '2026-03-15 06:21:16', '2026-03-15 06:21:16'),
(3, 'Due Date Reminder', 'Ikibanza ca {{student_name}} kirazira ku wa {{due_date}}. Mwakurikire kwishyura. Murakoze!', 1, 1, '2026-03-15 06:21:16', '2026-03-15 06:21:16'),
(4, 'Urgent Payment', 'Ubuzima{{student_name}}, nk\'ubushakashatsi bwo kwishyura! Ikibanze {{balance}} RWF. Mwakorere vuba. Murakoze!', 1, 1, '2026-03-15 06:21:16', '2026-03-15 06:21:16'),
(5, 'Balance Reminder', 'Muraho mwiriwe, umwana {{student_name}} ({{reg_number}}) afite ikibanza ya {{balance}} RWF. Mwakwifashishamo kwishyura vuba. Murakoze!', 1, 1, '2026-03-16 09:32:16', '2026-03-16 09:32:16'),
(6, 'Partial Payment Reminder', 'Muraho, kwishyura kwa {{student_name}} ntago ruzuzwa. Ikibanze ni {{balance}} RWF. Mwakubashishaka. Murakoze!', 1, 1, '2026-03-16 09:32:16', '2026-03-16 09:32:16'),
(7, 'Due Date Reminder', 'Ikibanza ca {{student_name}} kirazira ku wa {{due_date}}. Mwakurikire kwishyura. Murakoze!', 1, 1, '2026-03-16 09:32:16', '2026-03-16 09:32:16'),
(8, 'Urgent Payment', 'Ubuzima{{student_name}}, nk\'ubushakashatsi bwo kwishyura! Ikibanze {{balance}} RWF. Mwakorere vuba. Murakoze!', 1, 1, '2026-03-16 09:32:16', '2026-03-16 09:32:16');

-- --------------------------------------------------------

--
-- Table structure for table `reminder_exclusions`
--

CREATE TABLE `reminder_exclusions` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `excluded_by` int(11) DEFAULT NULL,
  `excluded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reminder_statistics`
--

CREATE TABLE `reminder_statistics` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `total_reminders_sent` int(11) DEFAULT 0,
  `successful_deliveries` int(11) DEFAULT 0,
  `failed_deliveries` int(11) DEFAULT 0,
  `parents_reminded` int(11) DEFAULT 0,
  `students_with_debtors` int(11) DEFAULT 0,
  `total_balance_notified` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `school_info`
--

CREATE TABLE `school_info` (
  `id` int(11) NOT NULL,
  `section` varchar(50) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `subtitle` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `map_url` text DEFAULT NULL,
  `opening_hours` varchar(200) DEFAULT NULL,
  `facebook_url` varchar(200) DEFAULT NULL,
  `twitter_url` varchar(200) DEFAULT NULL,
  `instagram_url` varchar(200) DEFAULT NULL,
  `youtube_url` varchar(200) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `school_info`
--

INSERT INTO `school_info` (`id`, `section`, `title`, `subtitle`, `description`, `phone`, `email`, `address`, `location`, `map_url`, `opening_hours`, `facebook_url`, `twitter_url`, `instagram_url`, `youtube_url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'about', 'About Garden TVET School', 'Excellence in Technical and Vocational Education', 'Garden TVET School is a leading technical and vocational education and training institution committed to providing quality education that empowers students with practical skills for the modern workforce.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', NULL, 'Mon-Fri: 7:00 AM - 5:00 PM', NULL, NULL, NULL, NULL, 1, '2026-03-15 06:21:25', '2026-03-15 06:21:25'),
(2, 'contact', 'Contact Us', 'Get in Touch with Us', 'We are here to answer any questions you may have about our programs, admissions, or general inquiries.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', NULL, 'Mon-Fri: 7:00 AM - 5:00 PM', NULL, NULL, NULL, NULL, 1, '2026-03-15 06:21:25', '2026-03-15 06:21:25'),
(3, 'services', 'Our Services', 'Comprehensive TVET Programs', 'We offer a range of technical and vocational training programs designed to equip students with practical skills.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', NULL, 'Mon-Fri: 7:00 AM - 5:00 PM', NULL, NULL, NULL, NULL, 1, '2026-03-15 06:21:25', '2026-03-15 06:21:25');

-- --------------------------------------------------------

--
-- Table structure for table `school_stats`
--

CREATE TABLE `school_stats` (
  `id` int(11) NOT NULL,
  `stat_key` varchar(50) NOT NULL,
  `stat_value` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `school_stats`
--

INSERT INTO `school_stats` (`id`, `stat_key`, `stat_value`, `label`, `icon`, `display_order`, `is_active`) VALUES
(1, 'students', '1200+', 'Students Enrolled', 'Users', 1, 1),
(2, 'teachers', '45+', 'Qualified Teachers', 'GraduationCap', 2, 1),
(3, 'trades', '3', 'Trade Programs', 'BookOpen', 3, 1),
(4, 'years', '15+', 'Years of Excellence', 'Award', 4, 1),
(5, 'graduates', '5000+', 'Graduates', 'Trophy', 5, 1),
(6, 'partners', '20+', 'Industry Partners', 'Handshake', 6, 1);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` varchar(200) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`) VALUES
(1, 'school_name', 'Garden TVET School', 'string', 'School name', '2026-03-15 06:20:21'),
(2, 'school_phone', '+250788123456', 'string', 'Contact phone', '2026-03-15 06:20:21'),
(3, 'school_email', 'info@garden.rw', 'string', 'Contact email', '2026-03-15 06:20:21'),
(4, 'school_address', 'Kigali, Rwanda', 'string', 'School address', '2026-03-15 06:20:21'),
(5, 'current_academic_year', '2025-2026', 'string', 'Current academic year', '2026-03-15 06:20:21'),
(6, 'current_term', 'Term 1', 'string', 'Current term', '2026-03-15 06:20:21'),
(7, 'attendance_enabled', 'true', 'boolean', 'Enable attendance tracking', '2026-03-15 06:20:21');

-- --------------------------------------------------------

--
-- Table structure for table `sms_logs`
--

CREATE TABLE `sms_logs` (
  `id` int(11) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `status` enum('sent','failed','pending') DEFAULT 'sent',
  `sent_by` int(11) DEFAULT NULL,
  `recipient_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sms_logs`
--

INSERT INTO `sms_logs` (`id`, `phone`, `message`, `status`, `sent_by`, `recipient_id`, `created_at`) VALUES
(1, '+250780000002', 'Amakuru yawe ya Garden TVET yahinduwe. Username:  Password: 123456', 'failed', NULL, NULL, '2026-03-15 10:27:40'),
(2, '0799447620', 'Murakaza neza reponse kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.', 'failed', NULL, NULL, '2026-03-15 12:15:32'),
(3, '0799447621', 'Murakaza neza reponse kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.', 'failed', NULL, NULL, '2026-03-16 10:31:15'),
(4, '0781234567', 'Murakaza neza Test kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.', 'failed', NULL, NULL, '2026-03-16 11:01:05'),
(5, '0784494628', 'Murakaza neza! Umwana reponse kdz yanditswe muri Garden TVET School. Nimero yandikisho: 2026/SOF/001. Software Development - Level 4.', 'sent', NULL, NULL, '2026-03-16 17:30:13'),
(6, '0784494628', 'Murikana bbb, umwana reponse kdz (Software Development - Level 4) ari kugira ikibanza mu kwishyura. Mungire amafaranga wo kwishyura vuba. Murakoze!', 'failed', NULL, NULL, '2026-03-17 06:20:14'),
(7, '0784494628', 'Murikana bbb, umwana reponse kdz (Software Development - Level 4) ari kugira ikibanza ya 1,650,000 RWF. Mungire amafaranga wo kwishyura vuba. Murakoze!', 'failed', NULL, NULL, '2026-03-18 15:12:25'),
(8, '0799447624', 'Murakaza neza reponse kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.', 'failed', NULL, NULL, '2026-03-18 15:54:39'),
(9, '0799447629', 'Murakaza neza reponse kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.', 'sent', NULL, NULL, '2026-03-25 13:37:14'),
(10, '0799447629', 'Murakaza neza reponse kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.', 'sent', NULL, NULL, '2026-03-25 13:37:14'),
(11, '0799447628', 'Murakaza neza kamana kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.', 'sent', NULL, NULL, '2026-03-25 14:07:55'),
(12, '0799447628', 'Murakaza neza kamana kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.', 'sent', NULL, NULL, '2026-03-25 14:07:55');

-- --------------------------------------------------------

--
-- Table structure for table `sms_reminders`
--

CREATE TABLE `sms_reminders` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `reminder_type` enum('payment_due','payment_overdue','payment_reminder','general') DEFAULT 'payment_reminder',
  `message` text NOT NULL,
  `amount_due` decimal(12,2) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','sent','failed','delivered') DEFAULT 'pending',
  `scheduled_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sent_at` timestamp NULL DEFAULT NULL,
  `africas_talking_id` varchar(100) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_templates`
--

CREATE TABLE `sms_templates` (
  `id` int(11) NOT NULL,
  `template_key` varchar(50) NOT NULL,
  `template_name` varchar(100) NOT NULL,
  `message_rw` text NOT NULL,
  `message_en` text DEFAULT NULL,
  `message_fr` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sms_templates`
--

INSERT INTO `sms_templates` (`id`, `template_key`, `template_name`, `message_rw`, `message_en`, `message_fr`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'leave_request', 'Icyifuzo cyamasezerano', 'Amakuru meza {{parent_name}}, umwana {{student_name}} yarasabye uruhushya rw{{leave_type}} kugeza {{end_date}}. {{reason}}', 'Good news {{parent_name}}, your child {{student_name}} has requested {{leave_type}} leave until {{end_date}}. {{reason}}', 'Bonne nouvelle {{parent_name}}, votre enfant {{student_name}} a demandé un congé {{leave_type}} jusqu\'au {{end_date}}. {{reason}}', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(2, 'leave_approved', 'Icyifuzo cyemerewe', 'Murikana {{parent_name}}, icyifuzo cya {{student_name}} cyo kuva ishuri cyemerewe. {{reason}} Azagaruka{{return_date}}.', 'Dear {{parent_name}}, leave request for {{student_name}} has been approved. {{reason}} They will return{{return_date}}.', 'Cher {{parent_name}}, la demande de congé de {{student_name}} a été approuvée. {{reason}} Ils reviendront{{return_date}}.', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(3, 'leave_rejected', 'Icyifuzo cyanzwe', 'Murikana {{parent_name}}, ikifuzo cya {{student_name}} cyo kuva ishuri cyanzwe. {{reason}}. Mungire ibitekerezo.', 'Dear {{parent_name}}, leave request for {{student_name}} has been rejected. {{reason}}. Please contact school.', 'Cher {{parent_name}}, la demande de congé de {{student_name}} a été rejetée. {{reason}}. Veuillez contacter l\'école.', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(4, 'sick_report', 'Raporo yarwaye', 'Murikana {{parent_name}}, umwana wawe {{student_name}} yarabajwe ko arwaye muri school. Impamvu: {{reason}}. {{action_taken}}.', 'Dear {{parent_name}}, your child {{student_name}} was reported sick at school. Reason: {{reason}}. {{action_taken}}.', 'Cher {{parent_name}}, votre enfant {{student_name}} a été signalé malade à l\'école. Raison: {{reason}}. {{action_taken}}.', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(5, 'sick_recovery', 'Yaraye', 'Murikana {{parent_name}}, umwana {{student_name}} yaraye neza agarutse mu ishuri. Murakoze!', 'Dear {{parent_name}}, {{student_name}} has recovered and returned to school. Thank you!', 'Cher {{parent_name}}, {{student_name}} s\'est rétabli et est revenu à l\'école. Merci!', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(6, 'discipline_warning', 'Ikibazo cyimyitwarire', 'Murikana {{parent_name}}, umwana {{student_name}} yagize ikibazo cyimyitwarire: {{issue}}. {{action}}.', 'Dear {{parent_name}}, your child {{student_name}} had a discipline issue: {{issue}}. {{action}}.', 'Cher {{parent_name}}, votre enfant {{student_name}} a eu un problème de discipline: {{issue}}. {{action}}.', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(7, 'discipline_suspension', 'Ibyagize ingaruka', 'Murikana {{parent_name}}, {{student_name}} yarahagaritswe kubera {{reason}}. Azagaruka{{return_date}}.', 'Dear {{parent_name}}, {{student_name}} has been suspended due to {{reason}}. They will return{{return_date}}.', 'Cher {{parent_name}}, {{student_name}} a été suspendu pour {{reason}}. Ils reviendront{{return_date}}.', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(8, 'discipline_resolved', 'Ibyigize byoroshye', 'Murikana {{parent_name}}, ikibazo cyimyitwarire cya {{student_name}} byakiriwe neza. {{resolution}}.', 'Dear {{parent_name}}, the discipline issue for {{student_name}} has been resolved. {{resolution}}.', 'Cher {{parent_name}}, le problème de discipline de {{student_name}} a été résolu. {{resolution}}.', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(9, 'payment_received', 'Ubwishyu Bwakiriwe', 'Muraho {{parent_name}}, twabonye ubwishyu bwa {{amount}} RWF bwo kwiga bwa {{student_name}}. Hasigaye {{balance}} RWF. Murakoze. - Garden TVET', 'Dear {{parent_name}}, we have received payment of {{amount}} RWF for {{student_name}}. Balance: {{balance}} RWF. Thank you. - Garden TVET', 'Cher {{parent_name}}, nous avons reçu le paiement de {{amount}} RWF pour {{student_name}}. Solde: {{balance}} RWF. Merci. - Garden TVET', 1, '2026-03-16 06:53:39', '2026-03-23 14:23:05', NULL, NULL),
(10, 'payment_reminder', 'Ibibutsa kwishyura', 'Murikana {{parent_name}}, umwana {{student_name}} ari kugira ikibanza ya {{balance}} RWF. Mungire amafaranga vuba. Murakoze!', 'Dear {{parent_name}}, {{student_name}} has a balance of {{balance}} RWF. Please pay soon. Thank you!', 'Cher {{parent_name}}, {{student_name}} a un solde de {{balance}} RWF. Veuillez payer bientôt. Merci!', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(11, 'payment_overdue', 'Kwishyura kurenze igihe', '{{parent_name}}, ikibanza cya {{student_name}} kirenze. {{balance}} RWF. Nyuma ya {{days}} iminsi bizamera. Mungire vuba.', '{{parent_name}}, {{student_name}}\'s payment is overdue. {{balance}} RWF. After {{days}} days it will increase. Pay now.', 'Le paiement de {{student_name}} est en retard. {{balance}} RWF. Après {{days}} jours, cela augmentera. Payez maintenant.', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(12, 'grade_added', 'Amanota Mashya', 'Muraho {{parent_name}}, umwana wawe {{student_name}} yatsindiye amanota mu isomo rya {{subject}}: {{score}}/{{max_score}} ({{grade}}). - Garden TVET', 'Dear {{parent_name}}, your child {{student_name}} received grades for {{subject}}: {{score}}/{{max_score}} ({{grade}}). - Garden TVET', 'Cher {{parent_name}}, votre enfant {{student_name}} a reçu des notes pour {{subject}}: {{score}}/{{max_score}} ({{grade}}). - Garden TVET', 1, '2026-03-16 06:53:39', '2026-03-23 14:23:02', NULL, NULL),
(13, 'welcome', 'Murakaza neza', 'Murakaza neza {{parent_name}} kuri Garden TVET School! Konti yawe irakindiye.', 'Welcome {{parent_name}} to Garden TVET School! Your account is ready.', 'Bienvenue {{parent_name}} à Garden TVET School! Votre compte est prêt.', 1, '2026-03-16 06:53:39', '2026-03-16 06:53:39', NULL, NULL),
(14, 'link_approved', 'Guhuza Kwemejwe', 'Muraho {{parent_name}}, ubusabe bwawe bwo guhuza n\'umwana {{student_name}} ({{reg_number}}) bwemejwe. Ubu urashobora kureba amakuru ye kuri Portal. - Garden TVET', 'Dear {{parent_name}}, your request to link with {{student_name}} ({{reg_number}}) has been approved. You can now view their records on the Portal. - Garden TVET', 'Cher {{parent_name}}, votre demande de liaison avec {{student_name}} ({{reg_number}}) a été approuvée. Vous pouvez maintenant voir ses dossiers sur le Portail. - Garden TVET', 1, '2026-03-16 06:53:39', '2026-03-23 14:23:04', NULL, NULL),
(44, 'student_created', 'Umunyeshuri Yanditswe', 'Murakaza neza! Umwana {{student_name}} yanditswe muri Garden TVET School. Reg: {{reg_number}}. {{trade}} - {{level}}. - Garden TVET', 'Welcome! {{student_name}} has been registered at Garden TVET School. Reg: {{reg_number}}. {{trade}} - {{level}}. - Garden TVET', 'Bienvenue! {{student_name}} a été inscrit à Garden TVET School. Reg: {{reg_number}}. {{trade}} - {{level}}. - Garden TVET', 1, '2026-03-16 15:51:05', '2026-03-23 14:23:06', NULL, NULL),
(45, 'student_updated', 'Amakuru yahinduwe', 'Murikana {{parent_name}}, amakuru ya {{student_name}} yahinduwe muri Garden TVET. {{changes}}', 'Dear {{parent_name}}, {{student_name}}\'s information has been updated at Garden TVET. {{changes}}', 'Cher {{parent_name}}, les informations de {{student_name}} ont été mises à jour à Garden TVET. {{changes}}', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(46, 'student_removed', 'Umunyeshuri yasibwe', 'Murikana {{parent_name}}, umwana wawe {{student_name}} yasibwe muri Garden TVET School. {{reason}}', 'Dear {{parent_name}}, your child {{student_name}} has been removed from Garden TVET School. {{reason}}', 'Cher {{parent_name}}, votre enfant {{student_name}} a été retiré de Garden TVET School. {{reason}}', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(47, 'student_on_leave', 'Umwana ku ruhushya', 'Murikana {{parent_name}}, umwana wawe {{student_name}} yarasabwe uruhushya rwo kuva ishuri{{return_date}}. Impamvu: {{reason}}.', 'Dear {{parent_name}}, your child {{student_name}} has been granted leave from school{{return_date}}. Reason: {{reason}}.', 'Cher {{parent_name}}, votre enfant {{student_name}} a été autorisé à quitter l\'école{{return_date}}. Raison: {{reason}}.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(48, 'student_reinstated', 'Umunyeshuri yagaruwe', 'Murikana {{parent_name}}, umwana wawe {{student_name}} agaruriwe mu nzego nziza muri Garden TVET School. {{resolution}}', 'Dear {{parent_name}}, your child {{student_name}} has been reinstated at Garden TVET School. {{resolution}}', 'Cher {{parent_name}}, votre enfant {{student_name}} a été réintégré à Garden TVET School. {{resolution}}', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(49, 'grade_updated', 'Ikigereranyo cyahinduwe', 'Murikana {{parent_name}}, ikigereranyo cya {{subject}} cya {{student_name}} cyahinduwe. Score: {{score}}/{{max_score}} ({{grade}}).', 'Dear {{parent_name}}, {{student_name}}\'s grade for {{subject}} has been updated. Score: {{score}}/{{max_score}} ({{grade}}).', 'Cher {{parent_name}}, la note de {{subject}} pour {{student_name}} a été mise à jour. Score: {{score}}/{{max_score}} ({{grade}}).', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(50, 'link_request_received', 'Icyifuzo cyabajwe', 'Murakaza neza {{parent_name}}! Icyifuzo cyawe cyo guhuza n\'umwana cyabajwe. Uzabihabira igihe.', 'Welcome {{parent_name}}! Your request to link with a student has been received. You will be notified soon.', 'Bienvenue {{parent_name}}! Votre demande de liaison avec un étudiant a été reçue. Vous serez bientôt notifié.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(51, 'link_rejected', 'Icyifuzo cyanzwe', 'Murikana {{parent_name}}, ikifuzo cyawe cyo guhuza n\'umwana cyanzwe. {{reason}} Utumanikire: +250 780 000 000.', 'Dear {{parent_name}}, your request to link with a student has been rejected. {{reason}} Contact: +250 780 000 000.', 'Cher {{parent_name}}, votre demande de liaison avec un étudiant a été rejetée. {{reason}} Contact: +250 780 000 000.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(52, 'staff_deleted', 'Konti yasibye', 'Murikana {{staff_name}}, konti yawe ya Garden TVET School yasibwe na {{deleted_by}}. Mungire ibitekerezo: +250 780 000 000.', 'Dear {{staff_name}}, your Garden TVET School account has been deleted by {{deleted_by}}. Contact: +250 780 000 000.', 'Cher {{staff_name}}, votre compte Garden TVET School a été supprimé par {{deleted_by}}. Contact: +250 780 000 000.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(53, 'staff_updated', 'Amakuru yahinduwe (Staff)', '{{staff_name}}, amakuru yawe ya Garden TVET yahinduwe. {{changes}}.', '{{staff_name}}, your Garden TVET information has been updated. {{changes}}.', '{{staff_name}}, vos informations Garden TVET ont été mises à jour. {{changes}}.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(54, 'password_changed', 'Ijambobanga ryahinduwe', '{{name}}, ijambobanga ryawe ryahinduwe kuri Garden TVET. Niba si we, itumanikire vuba.', '{{name}}, your password has been changed at Garden TVET. Contact school if this wasn\'t you.', '{{name}}, votre mot de passe a été changé à Garden TVET. Contactez l\'école si ce n\'était pas vous.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(55, 'parent_registered', 'Umubyeyi yanditswe', 'Murakaza neza {{parent_name}} kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza.', 'Welcome {{parent_name}} to Garden TVET School! Your parent account is ready.', 'Bienvenue {{parent_name}} à Garden TVET School! Votre compte parent est prêt.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(56, 'application_received', 'Icyifuzo cyabajwe (Apply)', '{{name}}, twabajye ikifuzo cyawe. Uzabihabira igihe.', 'We have received your application. You will be notified soon.', 'Nous avons reçu votre demande. Vous serez bientôt notifié.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(57, 'application_approved', 'Icyifuzo cyemerewe (Apply)', '{{name}}, ikifuzo cyawe cyemerewe! Ubu urashobora kwandika. Murakoze!', 'Your application has been approved! You can now register. Thank you!', 'Votre demande a été approuvée! Vous pouvez maintenant vous inscrire. Merci!', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(58, 'application_rejected', 'Icyifuzo cyanzwe (Apply)', '{{name}}, ikifuzo cyawe cyanzwe. Utumanikire.', 'Your application has been rejected. Contact school for more info.', 'Votre demande a été rejetée. Contactez l\'école pour plus d\'informations.', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(59, 'general_announcement', 'Itangazo', '{{parent_name}}, {{message}} - Garden TVET', '{{parent_name}}, {{message}} - Garden TVET', '{{parent_name}}, {{message}} - Garden TVET', 1, '2026-03-16 15:51:06', '2026-03-16 15:51:06', NULL, NULL),
(60, 'attendance_report', 'Raporo yo Kuhari', 'Muraho {{parent_name}}, tura kumenyesha ko umwana wawe {{student_name}} {{status_rw}} mu ishuri uyu munsi tariki {{date}}.{{notes}} - Garden TVET', 'Dear {{parent_name}}, we notify you that your child {{student_name}} {{status}} from school today {{date}}.{{notes}} - Garden TVET', 'Cher {{parent_name}}, nous vous informons que votre enfant {{student_name}} était {{status}} de l\'école aujourd\'hui {{date}}.{{notes}} - Garden TVET', 1, '2026-03-23 14:23:00', '2026-03-23 14:23:00', NULL, NULL),
(61, 'discipline_incident', 'Imyitwarire mibi', 'Muraho {{parent_name}}, tura kumenyesha ko {{student_name}} yagize ikibazo cy\'imyitwarire ({{type}}): {{description}}. - Garden TVET', 'Dear {{parent_name}}, we notify you that {{student_name}} had a disciplinary issue ({{type}}): {{description}}. - Garden TVET', 'Cher {{parent_name}}, nous vous informons que {{student_name}} a eu un incident disciplinaire ({{type}}): {{description}}. - Garden TVET', 1, '2026-03-23 14:23:02', '2026-03-23 14:23:02', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_items`
--

CREATE TABLE `stock_items` (
  `id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `quantity` int(11) DEFAULT 0,
  `status` varchar(50) DEFAULT 'available',
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `item_code` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT 'other',
  `unit` varchar(50) DEFAULT 'pieces',
  `min_quantity` int(11) DEFAULT 5,
  `location` varchar(200) DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `last_restocked` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_items`
--

INSERT INTO `stock_items` (`id`, `item_name`, `quantity`, `status`, `last_updated`, `item_code`, `category`, `unit`, `min_quantity`, `location`, `supplier`, `purchase_date`, `purchase_price`, `description`, `last_restocked`) VALUES
(1, 'dtyui', 555555, 'available', '2026-03-23 13:02:45', NULL, 'tools', 'pairs', 5, 'fgyuik', 'dfghj', '2026-12-22', 2345678.00, 'sdfghjkl', NULL),
(2, 'umuceryi', 20, 'available', '2026-03-25 13:53:11', NULL, 'equipment', 'kg', 3, 'stocj', 'nnnn', '0000-00-00', 20.00, 'hgtr4', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_transactions`
--

CREATE TABLE `stock_transactions` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `transaction_type` enum('purchase','usage','adjustment','damage','disposal','return') NOT NULL,
  `quantity` int(11) NOT NULL,
  `quantity_before` int(11) NOT NULL,
  `quantity_after` int(11) NOT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_transactions`
--

INSERT INTO `stock_transactions` (`id`, `item_id`, `transaction_type`, `quantity`, `quantity_before`, `quantity_after`, `unit_price`, `total_price`, `reference`, `notes`, `recorded_by`, `transaction_date`) VALUES
(1, 1, 'purchase', 555555, 0, 555555, 2345678.00, 99999999.99, NULL, NULL, 1, '2026-03-23 13:02:45'),
(2, 2, 'purchase', 20, 0, 20, 20.00, 400.00, NULL, NULL, 12, '2026-03-25 13:53:11');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `reg_number` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `trade` varchar(100) NOT NULL,
  `level` varchar(50) NOT NULL,
  `year_enrolled` year(4) DEFAULT NULL,
  `current_status` enum('active','sick','left','suspended') DEFAULT 'active',
  `enrollment_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `gender` enum('Male','Female') DEFAULT 'Male',
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_phone` varchar(20) DEFAULT NULL,
  `guardian_relation` varchar(50) DEFAULT NULL,
  `address_province` varchar(50) DEFAULT NULL,
  `address_district` varchar(50) DEFAULT NULL,
  `address_sector` varchar(50) DEFAULT NULL,
  `address_cell` varchar(50) DEFAULT NULL,
  `address_village` varchar(50) DEFAULT NULL,
  `parent_phone` varchar(20) DEFAULT NULL,
  `student_type` enum('public','private') DEFAULT 'private',
  `gpa` decimal(3,2) DEFAULT NULL,
  `attendance_rate` decimal(5,2) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `conduct_points` int(11) DEFAULT 40
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `reg_number`, `first_name`, `last_name`, `trade`, `level`, `year_enrolled`, `current_status`, `enrollment_date`, `created_at`, `gender`, `contact_phone`, `contact_email`, `guardian_name`, `guardian_phone`, `guardian_relation`, `address_province`, `address_district`, `address_sector`, `address_cell`, `address_village`, `parent_phone`, `student_type`, `gpa`, `attendance_rate`, `date_of_birth`, `conduct_points`) VALUES
(1, '2026/SOF/001', 'reponse', 'kdz', 'Software Development', 'Level 4', '2026', 'active', NULL, '2026-03-16 17:30:12', 'Female', '+250722725735', 'reponsekdz06@gmail.com', 'bbb', '0784494628', NULL, 'kigali', 'gasabo', 'nnnn', 'nn', NULL, NULL, 'public', NULL, NULL, '2000-12-04', 40),
(2, '2026/AUT/001', 'niyonasabye', 'innocent', 'Automobile Technology', 'Level 3', '2026', 'active', NULL, '2026-03-18 15:05:10', 'Male', '0798864433', NULL, NULL, NULL, NULL, 'Kigali City', 'kamonyi', 'runda', NULL, NULL, NULL, 'private', NULL, NULL, NULL, 40);

-- --------------------------------------------------------

--
-- Table structure for table `student_dynamic_columns`
--

CREATE TABLE `student_dynamic_columns` (
  `id` int(11) NOT NULL,
  `column_key` varchar(50) NOT NULL,
  `column_name` varchar(100) NOT NULL,
  `data_type` enum('text','number','date','select','checkbox','textarea') DEFAULT 'text',
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `trade_name` varchar(100) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_dynamic_columns`
--

INSERT INTO `student_dynamic_columns` (`id`, `column_key`, `column_name`, `data_type`, `options`, `trade_name`, `level`, `is_required`, `display_order`, `is_active`, `created_at`) VALUES
(1, 'health_status', 'Health Status', 'select', NULL, NULL, NULL, 0, 1, 1, '2026-03-16 09:32:10'),
(2, 'blood_type', 'Blood Type', 'select', NULL, NULL, NULL, 0, 2, 1, '2026-03-16 09:32:10'),
(3, 'emergency_contact', 'Emergency Contact', 'text', NULL, NULL, NULL, 1, 3, 1, '2026-03-16 09:32:10'),
(4, 'allergies', 'Allergies', 'textarea', NULL, NULL, NULL, 0, 4, 1, '2026-03-16 09:32:10'),
(5, 'scholarship', 'Scholarship Type', 'select', NULL, NULL, NULL, 0, 5, 1, '2026-03-16 09:32:10'),
(6, 'sponsor', 'Sponsor Organization', 'text', NULL, NULL, NULL, 0, 6, 1, '2026-03-16 09:32:10');

-- --------------------------------------------------------

--
-- Table structure for table `student_grades`
--

CREATE TABLE `student_grades` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `term` varchar(50) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `grade_type` enum('exam','quiz','assignment','project','attendance','participation','midterm','final') NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `max_score` decimal(5,2) NOT NULL DEFAULT 100.00,
  `percentage` decimal(5,2) GENERATED ALWAYS AS (`score` / `max_score` * 100) STORED,
  `grade_letter` varchar(2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_stats_cache`
--

CREATE TABLE `system_stats_cache` (
  `stat_key` varchar(100) NOT NULL,
  `stat_value` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trades`
--

CREATE TABLE `trades` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `levels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`levels`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trades`
--

INSERT INTO `trades` (`id`, `name`, `description`, `image_url`, `created_at`, `levels`) VALUES
(11, 'Software Development', 'Learn programming and software development skills', '/uploads/trade card image/sod.jpg', '2026-03-16 09:34:15', '[\"Level 3\", \"Level 4\", \"Level 5\"]'),
(12, 'Automobile Technology', 'Master automotive repair and maintenance', '/uploads/trade card image/auto.jpg', '2026-03-16 09:34:15', '[\"Level 3\", \"Level 4a\", \"Level 4b\", \"Level 5a\", \"Level 5b\"]'),
(13, 'Building and Construction', 'Civil engineering and construction skills', '/uploads/trade card image/bdc.jpg', '2026-03-16 09:34:15', '[\"Level 3\", \"Level 4\", \"Level 5\"]');

-- --------------------------------------------------------

--
-- Table structure for table `trade_galleries`
--

CREATE TABLE `trade_galleries` (
  `id` int(11) NOT NULL,
  `trade_name` varchar(100) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trade_galleries`
--

INSERT INTO `trade_galleries` (`id`, `trade_name`, `category`, `title`, `description`, `image_url`, `video_url`, `display_order`, `is_active`, `created_at`) VALUES
(1, 'Software Development', 'classroom', 'Programming Classes', 'Modern computer lab with latest software', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', NULL, 1, 1, '2026-03-16 09:32:10'),
(2, 'Software Development', 'practical', 'Hands-on Projects', 'Students working on real projects', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', NULL, 2, 1, '2026-03-16 09:32:10'),
(3, 'Software Development', 'certification', 'Certification', 'Industry-recognized certifications', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', NULL, 3, 1, '2026-03-16 09:32:10'),
(4, 'Automobile Technology', 'workshop', 'Auto Workshop', 'Fully equipped automotive workshop', 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800', NULL, 1, 1, '2026-03-16 09:32:10'),
(5, 'Automobile Technology', 'practical', 'Practical Training', 'Hands-on engine repair training', 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800', NULL, 2, 1, '2026-03-16 09:32:10'),
(6, 'Automobile Technology', 'tools', 'Specialized Tools', 'Industry-standard diagnostic tools', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', NULL, 3, 1, '2026-03-16 09:32:10'),
(7, 'Building & Construction', 'site', 'Construction Site', 'Real construction site training', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', NULL, 1, 1, '2026-03-16 09:32:10'),
(8, 'Building & Construction', 'lab', 'Materials Lab', 'Testing building materials', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800', NULL, 2, 1, '2026-03-16 09:32:10'),
(9, 'Building & Construction', 'blueprint', 'Blueprint Reading', 'Technical drawing and planning', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', NULL, 3, 1, '2026-03-16 09:32:10');

-- --------------------------------------------------------

--
-- Table structure for table `trade_images`
--

CREATE TABLE `trade_images` (
  `id` int(11) NOT NULL,
  `trade_name` varchar(100) NOT NULL,
  `image_type` enum('hero','gallery','thumbnail','banner') DEFAULT 'gallery',
  `image_url` varchar(500) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trade_images`
--

INSERT INTO `trade_images` (`id`, `trade_name`, `image_type`, `image_url`, `title`, `description`, `display_order`, `is_active`, `uploaded_by`, `created_at`) VALUES
(1, 'Software Development', 'hero', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200', 'Software Development', 'Learn programming and software development skills', 1, 1, NULL, '2026-03-16 09:32:10'),
(2, 'Automobile Technology', 'hero', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200', 'Automobile Technology', 'Master automotive repair and maintenance', 2, 1, NULL, '2026-03-16 09:32:10'),
(3, 'Building & Construction', 'hero', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200', 'Building & Construction', 'Civil engineering and construction skills', 3, 1, NULL, '2026-03-16 09:32:10');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','accountant','librarian','teacher','parent','director','director_of_discipline','stock_manager','registrar') DEFAULT 'teacher',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `province` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `sector` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `first_name`, `last_name`, `phone`, `email`, `role`, `created_at`, `province`, `district`, `sector`) VALUES
(1, 'admin', '$2b$10$0LPbLIFHHJMWGNwxxzyNx.PN4DEqCW1uX6f3n2r.nc6BUHKE28FPS', 'System', 'Admin', '+250780000000', NULL, 'admin', '2026-03-15 06:19:58', NULL, NULL, NULL),
(3, 'dod', '$2b$10$0D6VRxiJR4jAJtNguxIZeewkx7tbGvw1S59hQ0CG96PS/.HowN9Oq', 'Jean', 'Muhutu', '+250780000001', NULL, 'director_of_discipline', '2026-03-15 06:21:28', NULL, NULL, NULL),
(4, 'accountant', '$2b$10$BX8ofBN7l4k0MMXfCHE2AeZieFjSMandXPg7Ql9vYjnq68RzjWaBe', 'Marie', 'Mukamana', '+250780000002', NULL, 'accountant', '2026-03-15 06:21:28', NULL, NULL, NULL),
(5, 'parent_0799447620', '$2b$10$AmBeXWLVYW1CRkc4tNIADOCV/kAh4E12zB01i9Y0bqItYZV/wetF2', 'reponse', 'kdz', '0799447620', NULL, 'parent', '2026-03-15 12:15:31', 'Intara y\'Amajyepfo', 'Nyanza', 'Muyira'),
(10, 'parent_0799447621', '$2b$10$AmBeXWLVYW1CRkc4tNIADOCV/kAh4E12zB01i9Y0bqItYZV/wetF2', 'reponse', 'kdz', '0799447621', NULL, 'parent', '2026-03-16 10:31:10', 'Umujyi wa Kigali', 'Gasabo', 'Remera'),
(11, 'parent_0781234567', '$2b$10$YR7XjrN9ODIXAxmqdP.vpO6bVX8gXWqWtmJKjCZy4b/Ya102MJqfK', 'Test', 'User', '0781234567', NULL, 'parent', '2026-03-16 11:01:04', 'Kigali', 'Kicukiro', 'Gatenga'),
(12, 'stock_manager', '$2b$10$A2VLcgbXBoySAH3xaAQmn.SOKaE8FVixtDMmZD3xL7jWyDLRB9ndG', 'Stock', 'Manager', '0780000003', NULL, 'stock_manager', '2026-03-16 11:25:03', NULL, NULL, NULL),
(13, 'parent_0799447624', '$2b$10$/oexA8VAbv8AAMt8CigvNeEvFoAP1JEvxMfnko0Fx4u56n1KI45xK', 'reponse', 'kdz', '0799447624', NULL, 'parent', '2026-03-18 15:54:37', 'Umujyi wa Kigali', 'Gasabo', 'Gatsata'),
(14, 'parent_0799447629', '$2b$10$wnXiAa..DjnQ/WTox7ehGOc9RyeQ9N5XCQcHX48EvBTAYTuWMi17O', 'reponse', 'kdz', '0799447629', NULL, 'parent', '2026-03-25 13:37:09', 'Umujyi wa Kigali', 'Gasabo', 'Kacyiru'),
(15, 'parent_0799447628', '$2b$10$JifzH1kzo1zlI7lTNnF.uuB4JbLffq/MhXJohSI7W2mlx6bXWSqJG', 'kamana', 'eleze', '0799447628', NULL, 'parent', '2026-03-25 14:07:48', 'Intara y\'Amajyaruguru', 'Musanze', 'Muhoza');

-- --------------------------------------------------------

--
-- Structure for view `payments_with_receipts`
--
DROP TABLE IF EXISTS `payments_with_receipts`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `payments_with_receipts`  AS SELECT `p`.`id` AS `payment_id`, `p`.`student_id` AS `student_id`, `p`.`fee_id` AS `fee_id`, `p`.`amount_paid` AS `amount_paid`, `p`.`payment_date` AS `payment_date`, `p`.`payment_method` AS `payment_method`, `p`.`transaction_ref` AS `transaction_ref`, `p`.`notes` AS `notes`, `s`.`first_name` AS `student_first_name`, `s`.`last_name` AS `student_last_name`, `s`.`reg_number` AS `reg_number`, `s`.`trade` AS `trade`, `s`.`level` AS `student_level`, `pr`.`receipt_image_url` AS `receipt_image_url`, `pr`.`status` AS `receipt_status`, `pr`.`description` AS `receipt_description`, `pr`.`created_at` AS `receipt_uploaded_at` FROM ((`payments` `p` join `students` `s` on(`p`.`student_id` = `s`.`id`)) left join `payment_receipts` `pr` on(`p`.`id` = `pr`.`payment_id`)) ORDER BY `p`.`payment_date` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_attendance` (`student_id`,`date`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_student` (`student_id`);

--
-- Indexes for table `auto_reminder_settings`
--
ALTER TABLE `auto_reminder_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `cms_pages`
--
ALTER TABLE `cms_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `page_key` (`page_key`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_key` (`page_key`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `content_blocks`
--
ALTER TABLE `content_blocks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `section_name` (`section_name`);

--
-- Indexes for table `cron_jobs`
--
ALTER TABLE `cron_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `job_name` (`job_name`);

--
-- Indexes for table `discipline_appeals`
--
ALTER TABLE `discipline_appeals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `decided_by` (`decided_by`),
  ADD KEY `idx_discipline_appeals_discipline` (`discipline_id`);

--
-- Indexes for table `discipline_records`
--
ALTER TABLE `discipline_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `driving_assessments`
--
ALTER TABLE `driving_assessments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `driving_courses`
--
ALTER TABLE `driving_courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `driving_enrollments`
--
ALTER TABLE `driving_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enrollment` (`learner_id`,`course_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `driving_instructors`
--
ALTER TABLE `driving_instructors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `national_id` (`national_id`);

--
-- Indexes for table `driving_learners`
--
ALTER TABLE `driving_learners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `national_id` (`national_id`),
  ADD KEY `assigned_instructor_id` (`assigned_instructor_id`);

--
-- Indexes for table `driving_lessons`
--
ALTER TABLE `driving_lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `driving_materials`
--
ALTER TABLE `driving_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `driving_payments`
--
ALTER TABLE `driving_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `driving_quiz_questions`
--
ALTER TABLE `driving_quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `driving_quiz_results`
--
ALTER TABLE `driving_quiz_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `learner_id` (`learner_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `driving_road_signs`
--
ALTER TABLE `driving_road_signs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `driving_rules_users`
--
ALTER TABLE `driving_rules_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `national_id` (`national_id`);

--
-- Indexes for table `driving_stock`
--
ALTER TABLE `driving_stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_subject` (`subject`);

--
-- Indexes for table `fees`
--
ALTER TABLE `fees`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fee_structures`
--
ALTER TABLE `fee_structures`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `finance_dynamic_columns`
--
ALTER TABLE `finance_dynamic_columns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `column_key` (`column_key`);

--
-- Indexes for table `grade_archives`
--
ALTER TABLE `grade_archives`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_grade_archives_student` (`student_id`),
  ADD KEY `idx_grade_archives_deleted_at` (`deleted_at`);

--
-- Indexes for table `hero_slides`
--
ALTER TABLE `hero_slides`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_leave_requests_staff` (`staff_id`),
  ADD KEY `idx_leave_requests_student` (`student_id`);

--
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `author_id` (`author_id`);

--
-- Indexes for table `news_comments`
--
ALTER TABLE `news_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_comment_id` (`parent_comment_id`),
  ADD KEY `idx_news` (`news_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `news_engagement`
--
ALTER TABLE `news_engagement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_news` (`news_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_type` (`engagement_type`);

--
-- Indexes for table `news_images`
--
ALTER TABLE `news_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_news_id` (`news_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `parent_link_requests`
--
ALTER TABLE `parent_link_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `linked_student_id` (`linked_student_id`);

--
-- Indexes for table `parent_notifications`
--
ALTER TABLE `parent_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_parent_id` (`parent_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `parent_student_links`
--
ALTER TABLE `parent_student_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_link` (`parent_id`,`student_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `linked_by` (`linked_by`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `fee_id` (`fee_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `payment_receipts`
--
ALTER TABLE `payment_receipts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `idx_payment_id` (`payment_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `payment_reminders`
--
ALTER TABLE `payment_reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_reminders_student` (`student_id`),
  ADD KEY `idx_reminders_parent` (`parent_id`),
  ADD KEY `idx_reminders_type` (`reminder_type`),
  ADD KEY `idx_reminders_sent_at` (`sent_at`);

--
-- Indexes for table `payment_reminder_templates`
--
ALTER TABLE `payment_reminder_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `reminder_exclusions`
--
ALTER TABLE `reminder_exclusions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `excluded_by` (`excluded_by`);

--
-- Indexes for table `reminder_statistics`
--
ALTER TABLE `reminder_statistics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_date` (`date`),
  ADD KEY `idx_reminders_date` (`date`);

--
-- Indexes for table `school_info`
--
ALTER TABLE `school_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `section` (`section`);

--
-- Indexes for table `school_stats`
--
ALTER TABLE `school_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stat_key` (`stat_key`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_key` (`setting_key`);

--
-- Indexes for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `sms_reminders`
--
ALTER TABLE `sms_reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_sms_reminders_parent` (`parent_id`),
  ADD KEY `idx_sms_reminders_status` (`status`);

--
-- Indexes for table `sms_templates`
--
ALTER TABLE `sms_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `template_key` (`template_key`),
  ADD KEY `idx_key` (`template_key`);

--
-- Indexes for table `stock_items`
--
ALTER TABLE `stock_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_item` (`item_id`),
  ADD KEY `idx_type` (`transaction_type`),
  ADD KEY `idx_date` (`transaction_date`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reg_number` (`reg_number`);

--
-- Indexes for table `student_dynamic_columns`
--
ALTER TABLE `student_dynamic_columns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `column_key` (`column_key`);

--
-- Indexes for table `student_grades`
--
ALTER TABLE `student_grades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_term` (`term`,`academic_year`);

--
-- Indexes for table `system_stats_cache`
--
ALTER TABLE `system_stats_cache`
  ADD PRIMARY KEY (`stat_key`);

--
-- Indexes for table `trades`
--
ALTER TABLE `trades`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `trade_galleries`
--
ALTER TABLE `trade_galleries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_trade_galleries_trade` (`trade_name`);

--
-- Indexes for table `trade_images`
--
ALTER TABLE `trade_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auto_reminder_settings`
--
ALTER TABLE `auto_reminder_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cms_pages`
--
ALTER TABLE `cms_pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `content_blocks`
--
ALTER TABLE `content_blocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `cron_jobs`
--
ALTER TABLE `cron_jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `discipline_appeals`
--
ALTER TABLE `discipline_appeals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discipline_records`
--
ALTER TABLE `discipline_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_assessments`
--
ALTER TABLE `driving_assessments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_courses`
--
ALTER TABLE `driving_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_enrollments`
--
ALTER TABLE `driving_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_instructors`
--
ALTER TABLE `driving_instructors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_learners`
--
ALTER TABLE `driving_learners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_lessons`
--
ALTER TABLE `driving_lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_materials`
--
ALTER TABLE `driving_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_payments`
--
ALTER TABLE `driving_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_quiz_questions`
--
ALTER TABLE `driving_quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `driving_quiz_results`
--
ALTER TABLE `driving_quiz_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_road_signs`
--
ALTER TABLE `driving_road_signs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_rules_users`
--
ALTER TABLE `driving_rules_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driving_stock`
--
ALTER TABLE `driving_stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `exam_results`
--
ALTER TABLE `exam_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fees`
--
ALTER TABLE `fees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `fee_structures`
--
ALTER TABLE `fee_structures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `finance_dynamic_columns`
--
ALTER TABLE `finance_dynamic_columns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `grade_archives`
--
ALTER TABLE `grade_archives`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hero_slides`
--
ALTER TABLE `hero_slides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `news_comments`
--
ALTER TABLE `news_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `news_engagement`
--
ALTER TABLE `news_engagement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `news_images`
--
ALTER TABLE `news_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parent_link_requests`
--
ALTER TABLE `parent_link_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `parent_notifications`
--
ALTER TABLE `parent_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `parent_student_links`
--
ALTER TABLE `parent_student_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_receipts`
--
ALTER TABLE `payment_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_reminders`
--
ALTER TABLE `payment_reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_reminder_templates`
--
ALTER TABLE `payment_reminder_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `reminder_exclusions`
--
ALTER TABLE `reminder_exclusions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reminder_statistics`
--
ALTER TABLE `reminder_statistics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `school_info`
--
ALTER TABLE `school_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `school_stats`
--
ALTER TABLE `school_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `sms_logs`
--
ALTER TABLE `sms_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `sms_reminders`
--
ALTER TABLE `sms_reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_templates`
--
ALTER TABLE `sms_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `student_dynamic_columns`
--
ALTER TABLE `student_dynamic_columns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `student_grades`
--
ALTER TABLE `student_grades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trades`
--
ALTER TABLE `trades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `trade_galleries`
--
ALTER TABLE `trade_galleries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `trade_images`
--
ALTER TABLE `trade_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `auto_reminder_settings`
--
ALTER TABLE `auto_reminder_settings`
  ADD CONSTRAINT `auto_reminder_settings_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `cms_pages`
--
ALTER TABLE `cms_pages`
  ADD CONSTRAINT `cms_pages_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `discipline_appeals`
--
ALTER TABLE `discipline_appeals`
  ADD CONSTRAINT `discipline_appeals_ibfk_1` FOREIGN KEY (`discipline_id`) REFERENCES `discipline_records` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `discipline_appeals_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `discipline_appeals_ibfk_3` FOREIGN KEY (`decided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `discipline_records`
--
ALTER TABLE `discipline_records`
  ADD CONSTRAINT `discipline_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `discipline_records_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `driving_assessments`
--
ALTER TABLE `driving_assessments`
  ADD CONSTRAINT `driving_assessments_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `driving_courses` (`id`),
  ADD CONSTRAINT `driving_assessments_ibfk_2` FOREIGN KEY (`instructor_id`) REFERENCES `driving_instructors` (`id`);

--
-- Constraints for table `driving_courses`
--
ALTER TABLE `driving_courses`
  ADD CONSTRAINT `driving_courses_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `driving_instructors` (`id`);

--
-- Constraints for table `driving_enrollments`
--
ALTER TABLE `driving_enrollments`
  ADD CONSTRAINT `driving_enrollments_ibfk_1` FOREIGN KEY (`learner_id`) REFERENCES `driving_learners` (`id`),
  ADD CONSTRAINT `driving_enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `driving_courses` (`id`);

--
-- Constraints for table `driving_learners`
--
ALTER TABLE `driving_learners`
  ADD CONSTRAINT `driving_learners_ibfk_1` FOREIGN KEY (`assigned_instructor_id`) REFERENCES `driving_instructors` (`id`);

--
-- Constraints for table `driving_lessons`
--
ALTER TABLE `driving_lessons`
  ADD CONSTRAINT `driving_lessons_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `driving_courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `driving_materials`
--
ALTER TABLE `driving_materials`
  ADD CONSTRAINT `driving_materials_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `driving_instructors` (`id`);

--
-- Constraints for table `driving_quiz_questions`
--
ALTER TABLE `driving_quiz_questions`
  ADD CONSTRAINT `driving_quiz_questions_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `driving_courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `driving_quiz_results`
--
ALTER TABLE `driving_quiz_results`
  ADD CONSTRAINT `driving_quiz_results_ibfk_1` FOREIGN KEY (`learner_id`) REFERENCES `driving_learners` (`id`),
  ADD CONSTRAINT `driving_quiz_results_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `driving_courses` (`id`);

--
-- Constraints for table `driving_road_signs`
--
ALTER TABLE `driving_road_signs`
  ADD CONSTRAINT `driving_road_signs_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `driving_instructors` (`id`);

--
-- Constraints for table `driving_stock`
--
ALTER TABLE `driving_stock`
  ADD CONSTRAINT `driving_stock_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `driving_instructors` (`id`);

--
-- Constraints for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD CONSTRAINT `exam_results_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_results_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `news`
--
ALTER TABLE `news`
  ADD CONSTRAINT `news_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `news_comments`
--
ALTER TABLE `news_comments`
  ADD CONSTRAINT `news_comments_ibfk_1` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `news_comments_ibfk_2` FOREIGN KEY (`parent_comment_id`) REFERENCES `news_comments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `news_engagement`
--
ALTER TABLE `news_engagement`
  ADD CONSTRAINT `news_engagement_ibfk_1` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `news_images`
--
ALTER TABLE `news_images`
  ADD CONSTRAINT `news_images_ibfk_1` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `parent_link_requests`
--
ALTER TABLE `parent_link_requests`
  ADD CONSTRAINT `parent_link_requests_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `parent_link_requests_ibfk_2` FOREIGN KEY (`linked_student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `parent_notifications`
--
ALTER TABLE `parent_notifications`
  ADD CONSTRAINT `parent_notifications_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `parent_student_links`
--
ALTER TABLE `parent_student_links`
  ADD CONSTRAINT `parent_student_links_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `parent_student_links_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `parent_student_links_ibfk_3` FOREIGN KEY (`linked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`fee_id`) REFERENCES `fees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payment_receipts`
--
ALTER TABLE `payment_receipts`
  ADD CONSTRAINT `payment_receipts_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_receipts_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `payment_receipts_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `payment_reminders`
--
ALTER TABLE `payment_reminders`
  ADD CONSTRAINT `payment_reminders_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_reminders_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payment_reminders_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payment_reminder_templates`
--
ALTER TABLE `payment_reminder_templates`
  ADD CONSTRAINT `payment_reminder_templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reminder_exclusions`
--
ALTER TABLE `reminder_exclusions`
  ADD CONSTRAINT `reminder_exclusions_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reminder_exclusions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reminder_exclusions_ibfk_3` FOREIGN KEY (`excluded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sms_reminders`
--
ALTER TABLE `sms_reminders`
  ADD CONSTRAINT `sms_reminders_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sms_reminders_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD CONSTRAINT `stock_transactions_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `stock_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transactions_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_grades`
--
ALTER TABLE `student_grades`
  ADD CONSTRAINT `student_grades_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_grades_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trade_images`
--
ALTER TABLE `trade_images`
  ADD CONSTRAINT `trade_images_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
