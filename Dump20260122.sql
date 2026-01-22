-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: controle_presenca
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `coberturas`
--

DROP TABLE IF EXISTS `coberturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coberturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_coberturas_empresa` (`empresa_id`),
  CONSTRAINT `fk_coberturas_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coberturas`
--

LOCK TABLES `coberturas` WRITE;
/*!40000 ALTER TABLE `coberturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `coberturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colaboradores`
--

DROP TABLE IF EXISTS `colaboradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colaboradores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `condominio_id` int(11) DEFAULT NULL,
  `posto_id` int(11) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tipo` enum('fixo','cobertura') NOT NULL DEFAULT 'fixo',
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `posto_id` (`posto_id`),
  KEY `idx_colaboradores_condominio` (`condominio_id`),
  CONSTRAINT `colaboradores_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `colaboradores_ibfk_2` FOREIGN KEY (`posto_id`) REFERENCES `postos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colaboradores`
--

LOCK TABLES `colaboradores` WRITE;
/*!40000 ALTER TABLE `colaboradores` DISABLE KEYS */;
INSERT INTO `colaboradores` VALUES (1,'Testee',2,NULL,NULL,1,'2026-01-22 11:43:47','2026-01-22 11:43:47','cobertura'),(2,'teste3333',1,NULL,NULL,1,'2026-01-22 11:43:56','2026-01-22 11:43:56','fixo'),(3,'Teste colaborador Embu',5,1,1,1,'2026-01-22 13:46:22','2026-01-22 13:46:22','fixo'),(4,'Teste colaborador cobertura',5,NULL,NULL,1,'2026-01-22 13:46:36','2026-01-22 13:46:36','cobertura'),(5,'colaboradorfeitopelolancador1',6,2,1,1,'2026-01-22 18:57:35','2026-01-22 19:08:30','fixo'),(6,'rtetee',6,NULL,NULL,1,'2026-01-22 19:08:37','2026-01-22 19:08:37','cobertura');
/*!40000 ALTER TABLE `colaboradores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `condominio_postos`
--

DROP TABLE IF EXISTS `condominio_postos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `condominio_postos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `condominio_id` int(11) NOT NULL,
  `posto_id` int(11) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_condominio_posto` (`condominio_id`,`posto_id`),
  KEY `fk_cp_posto` (`posto_id`),
  CONSTRAINT `fk_cp_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cp_posto` FOREIGN KEY (`posto_id`) REFERENCES `postos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `condominio_postos`
--

LOCK TABLES `condominio_postos` WRITE;
/*!40000 ALTER TABLE `condominio_postos` DISABLE KEYS */;
/*!40000 ALTER TABLE `condominio_postos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `condominios`
--

DROP TABLE IF EXISTS `condominios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `condominios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `codigo_interno` varchar(50) DEFAULT NULL,
  `endereco` text DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `condominios`
--

LOCK TABLES `condominios` WRITE;
/*!40000 ALTER TABLE `condominios` DISABLE KEYS */;
INSERT INTO `condominios` VALUES (1,'DVR Embu','1',NULL,NULL,NULL,1,'2026-01-22 13:38:22','2026-01-22 13:38:22'),(2,'DVR Caçapava','2',NULL,NULL,NULL,1,'2026-01-22 13:38:29','2026-01-22 13:38:29'),(3,'DVR Itapevi','3',NULL,NULL,NULL,1,'2026-01-22 13:38:36','2026-01-22 13:38:36');
/*!40000 ALTER TABLE `condominios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cnpj` varchar(18) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `responsavel` varchar(100) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,'Teste',NULL,NULL,NULL,NULL,NULL,1,'2026-01-21 20:08:15','2026-01-21 20:08:15'),(2,'TEste222',NULL,NULL,NULL,NULL,NULL,1,'2026-01-21 20:08:20','2026-01-21 20:08:20'),(3,'Teste2222',NULL,NULL,NULL,NULL,NULL,1,'2026-01-21 20:30:55','2026-01-21 20:30:55'),(4,'Teste444444',NULL,NULL,NULL,NULL,NULL,1,'2026-01-22 11:45:10','2026-01-22 11:45:10'),(5,'Prevenção',NULL,NULL,NULL,NULL,NULL,1,'2026-01-22 13:44:36','2026-01-22 13:44:36'),(6,'Fernandes',NULL,NULL,NULL,NULL,NULL,1,'2026-01-22 15:37:13','2026-01-22 15:37:13');
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postos`
--

DROP TABLE IF EXISTS `postos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_nome_global` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postos`
--

LOCK TABLES `postos` WRITE;
/*!40000 ALTER TABLE `postos` DISABLE KEYS */;
INSERT INTO `postos` VALUES (1,'Testeporsto',NULL,NULL,1,'2026-01-22 11:48:02','2026-01-22 11:48:02');
/*!40000 ALTER TABLE `postos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `presencas_diarias`
--

DROP TABLE IF EXISTS `presencas_diarias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `presencas_diarias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `colaborador_id` int(11) NOT NULL,
  `condominio_id` int(11) NOT NULL,
  `posto_id` int(11) DEFAULT NULL,
  `status` enum('presente','falta','folga','atestado') NOT NULL DEFAULT 'falta',
  `observacoes` text DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cobertura_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_presenca` (`data`,`colaborador_id`,`posto_id`),
  KEY `posto_id` (`posto_id`),
  KEY `idx_data` (`data`),
  KEY `idx_colaborador` (`colaborador_id`),
  KEY `idx_condominio` (`condominio_id`),
  KEY `fk_pd_cobertura_colab` (`cobertura_id`),
  CONSTRAINT `fk_pd_cobertura_colab` FOREIGN KEY (`cobertura_id`) REFERENCES `colaboradores` (`id`),
  CONSTRAINT `presencas_diarias_ibfk_1` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `presencas_diarias_ibfk_2` FOREIGN KEY (`condominio_id`) REFERENCES `condominios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `presencas_diarias_ibfk_3` FOREIGN KEY (`posto_id`) REFERENCES `postos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `presencas_diarias`
--

LOCK TABLES `presencas_diarias` WRITE;
/*!40000 ALTER TABLE `presencas_diarias` DISABLE KEYS */;
INSERT INTO `presencas_diarias` VALUES (1,'2026-01-22',3,1,1,'falta','Teste observação','2026-01-22 13:47:05','2026-01-22 13:47:05',4),(2,'2026-01-22',4,1,1,'presente','Teste observação','2026-01-22 13:47:05','2026-01-22 13:47:05',NULL),(3,'2026-01-20',3,1,1,'presente',NULL,'2026-01-22 19:41:49','2026-01-22 19:41:49',NULL);
/*!40000 ALTER TABLE `presencas_diarias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_condominios`
--

DROP TABLE IF EXISTS `usuario_condominios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_condominios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `condominio_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_condominio` (`usuario_id`,`condominio_id`),
  KEY `fk_uc_condominio` (`condominio_id`),
  CONSTRAINT `fk_uc_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios` (`id`),
  CONSTRAINT `fk_uc_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_condominios`
--

LOCK TABLES `usuario_condominios` WRITE;
/*!40000 ALTER TABLE `usuario_condominios` DISABLE KEYS */;
INSERT INTO `usuario_condominios` VALUES (4,6,1);
/*!40000 ALTER TABLE `usuario_condominios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha_hash` varchar(255) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `perfil` enum('admin','gestor','lancador') NOT NULL DEFAULT 'lancador',
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (4,'Admin Sistema','adminn@empresa.com','$2b$10$Nv6nYTcEcnFj/oUHsPrz/.AGKJr6FBF2jxBdSvIJ824i3EGSOfaUa',NULL,'admin',1,'2025-12-08 21:07:38','2025-12-10 15:35:41'),(6,'Teste lançador só do embu','lancadoembu@empresa.com','$2b$10$moVCnx..ud2LRh/JOmGl3uV33sJLw/yWMPIj58eN3Mw/qJRA3q1lK',NULL,'lancador',1,'2026-01-22 18:55:54','2026-01-22 18:55:54');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-22 17:06:48
