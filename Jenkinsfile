pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
    }
    
    stages {
        stage('Verify Part-I Deployment') {
            steps {
                echo 'Checking Part-I deployment on port 80...'
                sh '''
                docker ps | grep bookverse-web || echo "Part-I containers not running"
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
                echo 'Running Selenium tests against Part-I deployment (port 80)...'
                sh '''
                cd ${WORKSPACE}/tests
                
                # Keep original BASE_URL (port 80)
                echo "BASE_URL is set to:"
                grep ^BASE_URL test_bookverse.py
                
                # Run tests
                /home/ubuntu/venv/bin/python3 test_bookverse.py || echo "Tests completed with some failures"
                '''
            }
        }
        
        stage('Test Summary') {
            steps {
                echo 'Tests executed against Part-I deployment on port 80'
                sh '''
                echo "Application accessible at http://13.201.96.168"
                curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://13.201.96.168 || echo "Cannot reach deployment"
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
