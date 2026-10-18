plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.footscoreci"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.footscoreci"
        minSdk = 24
        targetSdk = 36
        versionCode = 2
        versionName = "1.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        debug {
            buildConfigField(
                "String",
                "SERVER_BASE_URL",
                "\"https://footscore-ci-server.onrender.com\""
            )
            buildConfigField(
                "String",
                "BANNER_AD_UNIT_ID",
                "\"ca-app-pub-3940256099942544/9214589741\""
            )
        }

        release {
            isMinifyEnabled = false
            buildConfigField(
                "String",
                "SERVER_BASE_URL",
                "\"https://footscore-ci-server.onrender.com\""
            )
            buildConfigField(
                "String",
                "BANNER_AD_UNIT_ID",
                "\"ca-app-pub-5439140185488234/1818285567\""
            )
        }
    }

    buildFeatures {
        buildConfig = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.gms:play-services-ads:25.4.0")
}

