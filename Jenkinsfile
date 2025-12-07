pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
    }
    
    stages {
        stage('Cleanup Ports') {
            steps {
                echo 'Cleaning up old containers...'
                sh '''
                docker stop jenkins-bookverse-mongodb jenkins-bookverse-api jenkins-bookverse-web 2>/dev/null || true
                docker rm jenkins-bookverse-mongodb jenkins-bookverse-api jenkins-bookverse-web 2>/dev/null || true
                sleep 2
                '''
            }
        }
        
        stage('Checkout Application') {
            steps {
                echo 'Cloning application repository from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Romaisa-Munir/WebTechSemProject.git'
            }
        }
        
        stage('Prepare Environment') {
            steps {
                echo 'Creating docker-compose configuration...'
                sh '''
                cat > ${WORKSPACE}/docker-compose-jenkins.yml << 'COMPOSE_EOF'
services:
  jenkins-bookverse-db:
    image: mongo:6.0
    container_name: jenkins-bookverse-mongodb
    restart: always
    ports:
      - "27018:27017"
    volumes:
      - jenkins-bookverse-data:/data/db
      - ${WORKSPACE}/database:/tmp/db_files:ro
    networks:
      - jenkins-bookverse-network

  jenkins-bookverse-backend:
    image: spookie571/bookverse-backend:latest
    container_name: jenkins-bookverse-api
    restart: always
    environment:
      MONGODB_URI: mongodb://jenkins-bookverse-db:27017/bookverse
      JWT_SECRET: jenkins_secret_key_12345
      PORT: 5000
    ports:
      - "5001:5000"
    networks:
      - jenkins-bookverse-network
    depends_on:
      - jenkins-bookverse-db

  jenkins-bookverse-frontend:
    image: spookie571/bookverse-frontend:latest
    container_name: jenkins-bookverse-web
    restart: always
    ports:
      - "8081:80"
    networks:
      - jenkins-bookverse-network
    depends_on:
      - jenkins-bookverse-backend

volumes:
  jenkins-bookverse-data:

networks:
  jenkins-bookverse-network:
    driver: bridge
COMPOSE_EOF
                '''
            }
        }
        
        stage('Build & Deploy') {
            steps {
                echo 'Starting containers with docker-compose...'
                sh '''
                cd ${WORKSPACE}
                docker-compose -f docker-compose-jenkins.yml up -d
                sleep 10
                '''
            }
        }
        
        stage('Import Database') {
            steps {
                echo 'Importing database data...'
                sh '''
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection books --file /tmp/db_files/BOOKVERSE.books.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection genres --file /tmp/db_files/BOOKVERSE.genres.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection users --file /tmp/db_files/BOOKVERSE.users.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection wishlists --file /tmp/db_files/BOOKVERSE.wishlists.json --jsonArray --drop || true
                
                echo "Waiting for app to be ready..."
                sleep 5
                '''
            }
        }
        
        stage('Checkout Tests') {
            steps {
                echo 'Cloning test repository...'
                dir('tests') {
                    git branch: 'main',
                        url: 'https://github.com/Romaisa-Munir/bookverse-selenium-tests.git'
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                echo 'Running Selenium tests...'
                sh '''
                cd ${WORKSPACE}/tests
                
                # Change BASE_URL to Jenkins port
                sed -i 's|BASE_URL = "http://13.201.96.168"|BASE_URL = "http://13.201.96.168:8081"|' test_bookverse.py
                
                # Run tests
                /home/ubuntu/venv/bin/python3 test_bookverse.py || echo "Tests completed with some failures"
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Final verification...'
                sh '''
                docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep jenkins-bookverse
                echo "Application accessible at http://13.201.96.168:8081"
                '''
            }
        }
    }
    
    post {
        success {
            echo '✓ Pipeline completed successfully!'
        }
        failure {
            echo '✗ Pipeline encountered issues'
        }
    }
}
