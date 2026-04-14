-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 16, 2025 at 08:09 PM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `disaster_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `incidents`
--

CREATE TABLE `incidents` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `incidents`
--

INSERT INTO `incidents` (`id`, `title`, `description`, `latitude`, `longitude`, `status`, `created_at`, `user_id`) VALUES
(1, 'dgdf', 'dgdg', '44.968044', '-94.420303', 'resolved', '2025-09-16 13:40:19', NULL),
(2, 'Test Incident', 'Test incident description for API testing', '28.613900', '77.209000', 'resolved', '2025-09-16 16:05:55', 1),
(3, 'sdfsdf', 'sfsfsd', '28.623502', '77.435816', 'reported', '2025-09-16 16:06:23', 1),
(4, 'Comprehensive Test Incident', 'Testing improved API with proper error handling', '28.613900', '77.209000', 'verified', '2025-09-16 16:14:51', 1);

-- --------------------------------------------------------

--
-- Table structure for table `relief`
--

CREATE TABLE `relief` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `posted_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `relief`
--

INSERT INTO `relief` (`id`, `title`, `description`, `latitude`, `longitude`, `posted_by`, `created_at`) VALUES
(1, 'sfdsdf', 'sfdsfd', 21331, 11123, 2, '2025-09-16 18:00:47');

-- --------------------------------------------------------

--
-- Table structure for table `shelters`
--

CREATE TABLE `shelters` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `capacity` int(11) NOT NULL,
  `contact` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `shelters`
--

INSERT INTO `shelters` (`id`, `name`, `latitude`, `longitude`, `capacity`, `contact`) VALUES
(1, 'sfsdsdf', 63.025, -36.258, 10, '9999999999'),
(2, 'jhjhj', 2, 2, 4, '11313'),
(3, 'fdsfd', 22222200000000, 3122120000, 34, 'sdfsdfsfd'),
(4, 'sfsdfsdf', 113133000, 33311, 10, 'sfsdfsdf');

-- --------------------------------------------------------

--
-- Table structure for table `sos`
--

CREATE TABLE `sos` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `sos`
--

INSERT INTO `sos` (`id`, `user_id`, `message`, `latitude`, `longitude`, `status`, `created_at`) VALUES
(2, 1, 'sdfsfd', 28.6235, 77.4358, 'handled', '2025-09-16 16:07:23');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(200) NOT NULL,
  `role` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'testuser@gmail.com', 'pbkdf2:sha256:600000$dRZUEqoklGX9UnLE$0dd0185d09cbd8f0e0caeda3c9445c85036ec5ac97aa294e3147c39b734a50a2', 'user'),
(2, 'admin@gmail.com', 'pbkdf2:sha256:600000$VDuBybNm3LD2SRSC$2739aac8fedf8a8f62b0c91c0e950df6eb553a1ff5210fc28cd84693f4fe8f11', 'admin');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `incidents`
--
ALTER TABLE `incidents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `relief`
--
ALTER TABLE `relief`
  ADD PRIMARY KEY (`id`),
  ADD KEY `posted_by` (`posted_by`);

--
-- Indexes for table `shelters`
--
ALTER TABLE `shelters`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sos`
--
ALTER TABLE `sos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

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
-- AUTO_INCREMENT for table `incidents`
--
ALTER TABLE `incidents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `relief`
--
ALTER TABLE `relief`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `shelters`
--
ALTER TABLE `shelters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sos`
--
ALTER TABLE `sos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `incidents`
--
ALTER TABLE `incidents`
  ADD CONSTRAINT `incidents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `relief`
--
ALTER TABLE `relief`
  ADD CONSTRAINT `relief_ibfk_1` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `sos`
--
ALTER TABLE `sos`
  ADD CONSTRAINT `sos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
