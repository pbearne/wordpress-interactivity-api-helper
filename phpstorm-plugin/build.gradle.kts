plugins {
    id("java")
    id("org.jetbrains.intellij.platform") version "2.1.0"
    id("org.jetbrains.kotlin.jvm") version "2.0.21"
}

group = "com.ryanwelcher"
version = "1.0.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        phpstorm("2024.3")
        jetbrainsRuntime()

        // Plugins: com.jetbrains.php, JavaScript, HtmlTools
        bundledPlugin("com.jetbrains.php")
        bundledPlugin("JavaScript")
        bundledPlugin("HtmlTools")
        instrumentationTools()
    }
}

intellijPlatform {
    pluginConfiguration {
        id.set("com.ryanwelcher.wordpress-interactivity-api-helper")
        name.set("WordPress Interactivity API Helper")
    }
}

tasks {
    withType<JavaCompile>().configureEach {
        options.release.set(21)
    }

    withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
        compilerOptions.jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
    }

    patchPluginXml {
        sinceBuild.set("243")
        untilBuild.set("253.*")
    }

    signPlugin {
        certificateChain.set(System.getenv("CERTIFICATE_CHAIN"))
        privateKey.set(System.getenv("PRIVATE_KEY"))
        password.set(System.getenv("PRIVATE_KEY_PASSWORD"))
    }

    publishPlugin {
        token.set(System.getenv("PUBLISH_TOKEN"))
    }
}
